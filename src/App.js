import React from "react";
import { Routes, Route } from "react-router-dom";
import "./index.css";

import MainLayout from "./layouts/MainLayout.jsx";
import PostList from "./components/PostList.jsx";
import Weather from "./pages/Weather.jsx";

function NotFound() {
  return <div style={{ padding: 16 }}>Not Found</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Home 눌렀을 때 PostList 보이도록 */}
        <Route index element={<PostList />} />
        <Route path="posts" element={<PostList />} />
        <Route path="weather" element={<Weather />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
