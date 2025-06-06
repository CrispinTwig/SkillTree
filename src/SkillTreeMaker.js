import React, { useState, useEffect, useRef } from "react";
import pako from "pako";

function base64ToUint8Array(base64) {
  const raw = atob(base64);
  const uint8 = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    uint8[i] = raw.charCodeAt(i);
  }
  return uint8;
}

function uint8ArrayToBase64(uint8) {
  let binary = "";
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

function SkillEditor({ skill, index, cats, skills, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(skill.name);
  const [max, setMax] = useState(skill.maxPoints);
  const [cat, setCat] = useState(skill.category);
  const [newCat, setNewCat] = useState("");
  const [crit, setCrit] = useState({ ...skill.criteria });
  const [creq, setCreq] = useState({ ...skill.categoryRequirements });
  const [eff, setEff] = useState(skill.effect || "");
  const [ebase, setEbase] = useState(skill.effectBase || 0);

  const newing = cat && !cats.includes(cat);

  const input = (props) => (
    <input
      {...props}
      style={{
        ...props.style,
        width: "100%",
        border: "1px solid #111",
        padding: 4,
        borderRadius: 4,
        marginBottom: 6,
      }}
    />
  );

  const modalRef = useRef(null);
  const mouseDownOutside = useRef(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
      onMouseDown={(e) => {
        // Check if mousedown is outside modal
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          mouseDownOutside.current = true;
        } else {
          mouseDownOutside.current = false;
        }
      }}
      onClick={(e) => {
        // Only close if mousedown started outside
        if (mouseDownOutside.current) {
          onCancel();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          width: 500,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <label style={{ marginTop: 10, fontWeight: "bold" }}>Name</label>
        {input({
          value: name,
          onChange: (e) => setName(e.target.value),
          placeholder: "Name",
        })}
        <label style={{ marginTop: 10, fontWeight: "bold" }}>Max Level</label>
        {input({
          type: "number",
          value: max,
          onChange: (e) => setMax(+e.target.value),
          placeholder: "Max Points",
        })}

        <label style={{ marginTop: 10, fontWeight: "bold" }}>Category</label>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 6,
            padding: 4,
            border: "1px solid #111",
            borderRadius: 4,
          }}
        >
          <option value="">None</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
          <option value="__new__">+ New Category</option>
        </select>
        {cat === "__new__" &&
          input({
            placeholder: "New category",
            value: newCat,
            onChange: (e) => setNewCat(e.target.value),
          })}

        <h4 style={{ marginTop: 10, fontWeight: "bold" }}>Effect</h4>
        <label>Name of Effect (e.g., Strength, Agility)</label>
        {input({ value: eff, onChange: (e) => setEff(e.target.value), placeholder: "Effect Name" })}
        <label>Base Value (Effect value per level)</label>
        {input({
          type: "number",
          value: ebase,
          onChange: (e) => setEbase(+e.target.value),
          placeholder: "Base Value",
        })}

        <h4 style={{ marginTop: 10, fontWeight: "bold" }}>Skill Requirements</h4>
        <div style={{ maxHeight: 100, overflowY: "auto", border: "1px solid #ccc", padding: 6, borderRadius: 4 }}>
          {skills
            .filter((_, i) => i !== index)
            .map((x) => (
              <div key={x.id}>
                <span style={{ fontSize: 12 }}>{x.name}</span>
                <input
                  type="number"
                  value={crit[x.id] || ""}
                  onChange={(e) => setCrit({ ...crit, [x.id]: +e.target.value || 0 })}
                  style={{ marginLeft: 6, width: 50, border: "1px solid #ccc" }}
                />
              </div>
            ))}
        </div>

        <h4 style={{ marginTop: 10, fontWeight: "bold" }}>Category Requirements</h4>
        <div style={{ maxHeight: 100, overflowY: "auto", border: "1px solid #ccc", padding: 6, borderRadius: 4 }}>
          {cats.map((c) => (
            <div key={c}>
              <span style={{ fontSize: 12 }}>{c}</span>
              <input
                type="number"
                value={creq[c] || ""}
                onChange={(e) => setCreq({ ...creq, [c]: +e.target.value || 0 })}
                style={{ marginLeft: 6, width: 50, border: "1px solid #ccc" }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, marginBottom: 20 }}>
          <button onClick={onCancel} style={{ marginRight: 10 }}>
            Cancel
          </button>
          <button
            style={{ marginRight: 80 }}
            onClick={() => {
              onSave({
                name,
                maxPoints: +max,
                category: cat === "__new__" ? newCat : cat,
                criteria: crit,
                categoryRequirements: creq,
                effect: eff.trim(),
                effectBase: +ebase,
                effectPerLevel: 0,
              });
            }}
          >
            Save
          </button>
        </div>
        <hr />
        <button
          style={{ marginTop: 20 }}
          onClick={() => {
            // eslint-disable-next-line no-restricted-globals
            if (confirm("Are you sure you want to delete this skill?")) {
              onDelete();
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function SkillTreeMaker() {
  const [skills, setSkills] = useState([]);
  const [img, setImg] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const fileInputRef = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const totalPoints = skills.reduce((a, s) => a + s.points, 0);
  const effects = skills.reduce((acc, s) => {
    if (s.effect && s.points > 0) {
      const val = s.effectBase * s.points;
      acc[s.effect] = (acc[s.effect] || 0) + val;
    }
    return acc;
  }, {});
  const cats = [...new Set(skills.map((s) => s.category).filter(Boolean))];

  const unlocked = (s) => {
    for (let [id, req] of Object.entries(s.criteria || {})) {
      const dep = skills.find((x) => x.id == id);
      if (!dep || dep.points < req) return false;
    }
    for (let [cat, req] of Object.entries(s.categoryRequirements || {})) {
      const total = skills.filter((x) => x.category === cat).reduce((a, b) => a + b.points, 0);
      if (total < req) return false;
    }
    return true;
  };

  const update = (i, v) => setSkills(skills.map((s, j) => (j === i ? { ...s, ...v } : s)));

  const dragRef = useRef(null);
  const move = (e) => {
    if (!dragRef.current) return;
    const { idx, sx, sy, ox, oy } = dragRef.current;
    update(idx, { x: ox + e.clientX - sx, y: oy + e.clientY - sy });
  };

  const exportConfig = () => {
    const prefixMatch = img.match(/^data:image\/(png|jpeg|jpg);base64,/);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    const base64Data = prefix ? img.slice(prefix.length) : img;

    const imgBytes = base64ToUint8Array(base64Data);
    const compressed = pako.gzip(imgBytes);
    const compressedBase64 = uint8ArrayToBase64(compressed);

    const exportObj = {
      skills,
      imageCompressed: compressedBase64,
      imagePrefix: prefix,
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skilltree-config.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const p = JSON.parse(text);
      if (p.skills) {
        setSkills(p.skills);
        if (p.imageCompressed) {
          const compressedBytes = base64ToUint8Array(p.imageCompressed);
          const decompressedBytes = pako.ungzip(compressedBytes);
          const base64Str = uint8ArrayToBase64(decompressedBytes);
          const imgStr = (p.imagePrefix || "") + base64Str;
          setImg(imgStr);
        } else {
          setImg(p.imageBase64 || "");
        }
        setEditIdx(null);
      }
    } catch (err) {
      alert("Failed to load config: " + err.message);
    }
  };

  const pointsPerCategory = cats.reduce((acc, cat) => {
    acc[cat] = skills.filter(s => s.category === cat).reduce((sum, s) => sum + s.points, 0);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif", fontSize: "14px", userSelect: "none" }}>
      <div style={{ flex: 1, borderRight: "1px solid #ccc", padding: 10 }}>
        <input
          placeholder="Paste base64 image here (data:image/png;base64,...)"
          value={img}
          onChange={(e) => setImg(e.target.value)}
          style={{ width: "100%", border: "1px solid #111", padding: 4, borderRadius: 4, marginBottom: 6 }}
        />
        <div
          style={{
            position: "relative",
            background: "#eee",
            border: "1px solid #ccc",
            width: 800,
            margin: "auto",
          }}
        >
          {img ? (
            <img src={img} style={{ width: "100%" }} />
          ) : (
            <div style={{ height: 600, textAlign: "center", lineHeight: "600px", color: "#666" }}>
              Paste base64 image above
            </div>
          )}
          <div style={{ position: "absolute", inset: 0 }}>
            {skills.map((s, i) => (
              <div
                key={s.id}
                onMouseDown={(e) => {
                  dragRef.current = { idx: i, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y };
                  window.addEventListener("mousemove", move);
                  window.addEventListener("mouseup", () => {
                    dragRef.current = null;
                    window.removeEventListener("mousemove", move);
                  });
                }}
                onDoubleClick={() => setEditIdx(i)}
                style={{
                  position: "absolute",
                  left: s.x,
                  top: s.y,
                  width: s.width,
                  height: s.height,
                  background: unlocked(s) ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
                  border: unlocked(s) ? "1px solid #000" : "1px solid #ddd",
                  color: unlocked(s) ? "#000" : "#fff",
                  fontSize: 11,
                  padding: 4,
                  cursor: "move",
                  textAlign: "center"
                }}
              >
                {s.name} ({s.points}/{s.maxPoints})
                {unlocked(s) && (
                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        update(i, { points: Math.min(s.points + 1, s.maxPoints) });
                      }}
                      onDoubleClick={(e) => e.stopPropagation()}  // <-- ADD THIS
                      style={{
                        fontSize: 12,
                        padding: 1,
                        border: "1px solid #000",
                        background: "#fff",
                        color: "#000",
                        height: "25px",
                        width: "25px",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          width: 350,
          padding: 10,
          overflowY: "auto",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start", // ensures sticky works in flexbox
          maxHeight: "100vh", // optional: limit height to viewport
        }}
      >
        <h4 style={{ fontWeight: "bold" }}>Total Points Spent: {totalPoints}</h4>
        <button
          onClick={() =>
            setSkills([...skills, {
              id: Date.now(),
              name: `Skill${skills.length + 1}`,
              x: 0,
              y: 0,
              width: 100,
              height: 50,
              points: 0,
              maxPoints: 10,
              criteria: {},
              category: "",
              categoryRequirements: {},
              effect: "",
              effectBase: 0,
              effectPerLevel: 0,
            }])
          }
          style={{  border: "1px solid #000", padding: "2px 5px" }}
        >
          + Add
        </button>
        <button onClick={() => setSkills(skills.map((s) => ({ ...s, points: 0 })))} style={{ marginLeft: 5, border: "1px solid #000", padding: "2px 5px"  }}>
          Reset points
        </button>

        <h4 style={{ fontWeight: "bold", marginTop: "10px" }}>Effects</h4>
        <ul style={{ padding: 5, background: "#ceefce" }}>
          {Object.entries(effects).map(([k, v]) => (
            <li key={k}><b>{v}</b>{k}</li>
          ))}
        </ul>


        <div style={{ marginBottom: 10 }}>
          <h4 style={{ fontWeight: "bold" }}>Points Spent Per Category</h4>
          <ul style={{ paddingLeft: 20, marginTop: 0, marginBottom: 10 }}>
            {Object.entries(pointsPerCategory).map(([cat, pts]) => (
              <li key={cat}>
                <b>{cat}:</b> {pts}
              </li>
            ))}
          </ul>
        </div>

        <h4 style={{ fontWeight: "bold", marginTop: "10px" }}>Skills</h4>
        <div style={{ height: 500, overflow: "hidden", overflowY: "scroll"}}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, textAlign: "center" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Name</th>
                <th>Category</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s, i) => (
                <tr
                  key={s.id}
                  draggable
                  onDragStart={() => setDraggingIdx(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(i);
                  }}
                  onDrop={() => {
                    if (draggingIdx !== null && draggingIdx !== i) {
                      const updated = [...skills];
                      const [moved] = updated.splice(draggingIdx, 1);
                      updated.splice(i, 0, moved);
                      setSkills(updated);
                    }
                    setDraggingIdx(null);
                    setDragOverIdx(null);
                  }}
                  style={{
                    background:
                      draggingIdx === i
                        ? "#cce5ff"
                        : dragOverIdx === i
                        ? "#d4edda"
                        : unlocked(s)
                        ? "transparent"
                        : "#efefef",
                    cursor: "move",
                    padding: "2px 5px",
                  }}
                >
                  <td style={{ textAlign: "left", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{s.name}</td>
                  <td style={{ fontSize: 10, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 40 }}>{s.category}</td>
                  <td>
                    <button onClick={() => setEditIdx(i)} style={{ fontSize: 10 }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr/>
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          <button onClick={exportConfig} style={{ flex: 1 }}>
            Export Config
          </button>
          <button onClick={() => fileInputRef.current.click()} style={{ flex: 1 }}>
            Load Config
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,application/json"
            style={{ display: "none" }}
            onChange={loadFromFile}
          />
        </div>
      </div>

      {editIdx !== null && (
        <SkillEditor
          skill={skills[editIdx]}
          index={editIdx}
          cats={cats}
          skills={skills}
          onCancel={() => setEditIdx(null)}
          onSave={(s) => {
            const updated = [...skills];
            updated[editIdx] = { ...updated[editIdx], ...s };
            setSkills(updated);
            setEditIdx(null);
          }}
          onDelete={() => {
            const updated = [...skills];
            updated.splice(editIdx, 1);
            setSkills(updated);
            setEditIdx(null);
          }}
        />
      )}
    </div>
  );
}
