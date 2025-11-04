import { useEffect, useRef, useState } from "react";
import {
  getByCity,
  getByCoords,
  geocodeCity,
  getForecastByCoords,
  iconUrl,
} from "../services/openweather.js";
import WeatherCard from "../components/WeatherCard.jsx";
import ForecastList from "../components/ForecastList.jsx";

export default function Weather() {
  const [city, setCity] = useState("");
  const [units, setUnits] = useState("metric");
  const [data, setData] = useState(null);        // 현재 날씨
  const [forecast, setForecast] = useState(null); // 5일 예보
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const lastRef = useRef(null);

  const fetchByCityFlow = async (name, opts = {}) => {
    if (!name?.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      // 현재 날씨(도시명으로)
      const cur = await getByCity(name.trim(), { units, lang: "kr" }, opts);
      setData(cur);

      // Geocoding → 좌표
      const geo = await geocodeCity(name.trim(), { limit: 1 }, opts);
      if (!geo?.length) throw new Error("도시를 찾을 수 없습니다.");
      const { lat, lon } = geo[0];

      // 예보(좌표로)
      const fc = await getForecastByCoords(lat, lon, { units, lang: "kr" }, opts);
      setForecast(fc);

      lastRef.current = { type: "coords", lat, lon };
    } catch (e) {
      setErr(e);
      setData(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchByCoordsFlow = async (lat, lon, opts = {}) => {
    if (lat == null || lon == null) return;
    setLoading(true);
    setErr(null);
    try {
      const [cur, fc] = await Promise.all([
        getByCoords(lat, lon, { units, lang: "kr" }, opts),
        getForecastByCoords(lat, lon, { units, lang: "kr" }, opts),
      ]);
      setData(cur);
      setForecast(fc);
      lastRef.current = { type: "coords", lat, lon };
    } catch (e) {
      setErr(e);
      setData(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  // 단위 변경 시 마지막 소스 기준으로 둘 다 재요청
  useEffect(() => {
    const src = lastRef.current;
    if (!src) return;
    if (src.type === "coords") fetchByCoordsFlow(src.lat, src.lon);
  }, [units]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (e) => {
    e.preventDefault();
    fetchByCityFlow(city);
  };

  const onMyLocation = () => {
    if (!navigator.geolocation) {
      setErr(new Error("이 브라우저는 위치 정보를 지원하지 않습니다."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchByCoordsFlow(latitude, longitude);
      },
      () => setErr(new Error("위치 권한을 허용해주세요.")),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Weather</h1>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="도시 이름 (예: Seoul)"
          aria-label="city"
        />
        <button type="submit">검색</button>
        <button type="button" onClick={onMyLocation}>내 위치</button>

        <label style={{ marginLeft: "auto" }}>
          단위:&nbsp;
          <select value={units} onChange={(e) => setUnits(e.target.value)}>
            <option value="metric">°C</option>
            <option value="imperial">°F</option>
          </select>
        </label>
      </form>

      {loading && <p aria-busy="true">불러오는 중...</p>}
      {err && <p role="alert" style={{ color: "#d33" }}>오류: {err.message}</p>}
      {!loading && !err && !data && <p>도시를 검색하거나 내 위치를 눌러보세요.</p>}

      <WeatherCard data={data} iconUrl={iconUrl} />

      {/* 5일/3시간 예보 */}
      <ForecastList data={forecast} />
    </div>
  );
}