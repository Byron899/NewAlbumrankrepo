
import React, { useEffect, useState } from "react";

const API_URL = "https://albumbackende-1.onrender.com";

function App() {
  const [albums, setAlbums] = useState([]);
  const [albumForm, setAlbumForm] = useState({ title: "", artist: "", type: "Album" });
  const [songs, setSongs] = useState([{ title: "", rating: "", note: "" }]);
  const [average, setAverage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [sortKey, setSortKey] = useState("average");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchAlbums();
  }, [sortKey, sortOrder]);

  useEffect(() => {
    calculateAverage();
  }, [songs]);

  const fetchAlbums = async () => {
    const res = await fetch(`${API_URL}?sort=${sortKey}&order=${sortOrder}`);
    const data = await res.json();
    setAlbums(data);
  };

  const handleAlbumChange = (e) => {
    setAlbumForm({ ...albumForm, [e.target.name]: e.target.value });
  };

  const handleSongChange = (i, field, value) => {
    const newSongs = [...songs];
    newSongs[i][field] = value;
    setSongs(newSongs);
  };

  const addSongField = () => {
    if (songs.length < 50) setSongs([...songs, { title: "", rating: "", note: "" }]);
  };

  const calculateAverage = () => {
    const ratings = songs.map(s => parseFloat(s.rating)).filter(r => !isNaN(r));
    const total = ratings.reduce((a, b) => a + b, 0);
    const avg = ratings.length ? (total / ratings.length).toFixed(2) : null;
    setAverage({ total, average: avg, max: ratings.length * 10 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filteredSongs = songs.filter(s => s.title && s.rating);
    if (!albumForm.title || !albumForm.artist || filteredSongs.length === 0) {
      alert("Fill out album info and songs.");
      return;
    }

    const payload = { ...albumForm, songs: filteredSongs };
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      resetForm();
      fetchAlbums();
    } else {
      alert("Error saving album");
    }
  };

  const resetForm = () => {
    setAlbumForm({ title: "", artist: "", type: "Album" });
    setSongs([{ title: "", rating: "", note: "" }]);
    setAverage(null);
    setEditingId(null);
  };

  const handleEdit = (album) => {
    setAlbumForm({
      title: album.title,
      artist: album.artist,
      type: album.type,
    });
    setSongs(album.songs);
    setEditingId(album.id);
    calculateAverage();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this album?")) return;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchAlbums();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1> Album Ranking App</h1>

      <form onSubmit={handleSubmit}>
        <input name="title" value={albumForm.title} onChange={handleAlbumChange} placeholder="Album Title" required />
        <input name="artist" value={albumForm.artist} onChange={handleAlbumChange} placeholder="Artist" required />
        <input name="type" value={albumForm.type} onChange={handleAlbumChange} placeholder="Album Type" />
        <h3>Songs</h3>
        {songs.map((song, idx) => (
          <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input value={song.title} onChange={(e) => handleSongChange(idx, "title", e.target.value)} placeholder="Song Title" required />
            <input type="number" value={song.rating} onChange={(e) => handleSongChange(idx, "rating", e.target.value)} placeholder="Rating" min="0" max="10" required />
            <input value={song.note} onChange={(e) => handleSongChange(idx, "note", e.target.value)} placeholder="Note" />
          </div>
        ))}
        <button type="button" onClick={addSongField}>+ Add Song</button><br /><br />
        {average && <p> Avg: <strong>{average.average}/10</strong> ({average.total}/{average.max})</p>}
        <button type="submit">{editingId ? "Update" : "Add"} Album</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel Edit</button>}
      </form>

      <h2> Ranked Albums</h2>
      <div>
        <label>Sort by: </label>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="average">Average</option>
          <option value="title">Title</option>
          <option value="total_score">Score</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">↓ Desc</option>
          <option value="asc">↑ Asc</option>
        </select>
      </div>
      {albums.map(album => (
        <div key={album.id} style={{ borderBottom: "1px solid #ccc", padding: "1rem 0" }}>
          <h3>{album.rank}. {album.title} by {album.artist}</h3>
          <p>Type: {album.type}</p>
          <p>Avg: {album.average}/10 ({album.total_score}/{album.max_score})</p>
          <ul>
            {album.songs.map((s, i) => (
              <li key={i}>{s.title} — {s.rating}/10 {s.note && `(${s.note})`}</li>
            ))}
          </ul>
          <button onClick={() => handleEdit(album)}> Edit</button>
          <button onClick={() => handleDelete(album.id)}> Delete</button>
        </div>
      ))}
    </div>
  );
}

export default App;
