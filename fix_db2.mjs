fetch("http://localhost:3000/api/state").then(r => r.json()).then(state => {
  const custom = state.customization;
  if (!custom.gallery || custom.gallery.length === 0) {
    custom.gallery = [
      {
        "image": "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=400&q=80",
        "title": "BIMTEK DINAS TENAGA KERJA KAB.PATI",
        "id": 1
      },
      {
        "title": "MOU - MITRA SO",
        "id": 2,
        "image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80"
      },
      {
        "image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80",
        "title": "KEBERANGKATAN SISWA SCI",
        "id": 3
      },
      {
        "title": "PEMBELAJARAN",
        "id": 4,
        "image": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=80"
      }
    ];
  }
  fetch("http://localhost:3000/api/state/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: "customization",
      action: "update",
      payload: custom
    })
  }).then(r => r.json()).then(console.log);
});
