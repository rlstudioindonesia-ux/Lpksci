fetch("http://localhost:3000/api/state").then(r => r.json()).then(state => {
  const custom = state.customization;
  if (custom.slides) {
    custom.slides = custom.slides.map((s, i) => {
      if (s.image && s.image.startsWith("/uploads/")) {
        const fallback = [
          "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80"
        ];
        return { ...s, image: fallback[i % fallback.length] };
      }
      return s;
    });
  }
  if (custom.gallery) {
    custom.gallery = custom.gallery.map((s, i) => {
      if (s.image && s.image.startsWith("/uploads/")) {
        const fallback = [
          "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80"
        ];
        return { ...s, image: fallback[i % fallback.length] };
      }
      return s;
    });
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
