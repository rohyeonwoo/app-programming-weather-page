import { NavLink, Outlet } from "react-router-dom";

export default function MainLayout() {
  const linkStyle = ({ isActive }) => ({
    padding: "6px 10px",
    borderRadius: 8,
    textDecoration: "none",
    color: isActive ? "#1f2937" : "#6b7280",
    background: isActive ? "#dbeafe" : "transparent",
    marginRight: 12
  });

  return (
    <div>
      <nav style={{ padding: 12, borderBottom: "1px solid #eee" }}>
        <strong style={{ marginRight: 16 }}>WeatherApp</strong>
        <NavLink to="/" style={linkStyle}>Home</NavLink>
        <NavLink to="/posts" style={linkStyle}>Posts</NavLink>
        <NavLink to="/weather" style={linkStyle}>Weather</NavLink>
      </nav>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
