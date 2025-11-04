// src/pages/Weather.jsx
import { useEffect, useRef, useState } from "react";
import {
  getByCity,
  getByCoords,
  getForecastByCoords,
  iconUrl,
} from "../services/openweather.js";
import WeatherCard from "../components/WeatherCard.jsx";
import ForecastList from "../components/ForecastList.jsx";

/** ====== a11y: 스크린리더용 숨김 스타일 ====== */
const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  width: "1px",
  whiteSpace: "nowrap",
};

/** ====== 캐시 설정(기존 그대로) ====== */
const CACHE_TTL_MS_CURRENT = 10 * 60 * 1000;
const CACHE_TTL_MS_FORECAST = 10 * 60 * 1000;
const KEY_LAST_COORDS = "ow:lastCoords";
const keyCityIndex = (norm) => `ow:cityIndex:${norm}`;
const keyCurrent = (units, lat, lon) =>
  `ow:current:${units}:${lat.toFixed(3)},${lon.toFixed(3)}`;
const keyForecast = (units, lat, lon) =>
  `ow:forecast:${units}:${lat.toFixed(3)},${lon.toFixed(3)}`;

const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch { return null; } };
const fresh = (obj, ttl) => obj && typeof obj.ts === "number" && (Date.now() - obj.ts) < ttl;
const normCity = (s) => s.trim().toLowerCase();

export default function Weather() {
  // ----- state -----
  const [city, setCity] = useState("");
  const [units, setUnits] = useState("metric");
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // 마지막 좌표 / 디바운스 / 진행중 요청
  const lastRef = useRef(null);
  const timerRef = useRef(null);
  const acRef = useRef(null);

  // ===== a11y 포커스 타깃 refs =====
  const errorRef = useRef(null);
  const resultsHeadingRef = useRef(null);

  // ====== 공통 fetchers (원래 코드 그대로) ======
  const fetchByCoordsSmart = async (lat, lon, controller, want = { current: true, forecast: true }) => {
    const opts = controller ? { signal: controller.signal } : {};
    const tasks = [];
    if (want.current)  tasks.push(getByCoords(lat, lon, { units, lang: "kr" }, opts));
    if (want.forecast) tasks.push(getForecastByCoords(lat, lon, { units, lang: "kr" }, opts));
    const res = await Promise.all(tasks);
    const cur = want.current ? res[0] : null;
    const fc  = want.current ? (want.forecast ? res[1] : null) : res[0];
    if (cur) setData(cur);
    if (fc)  setForecast(fc);
    writeCaches(lat, lon, cur, fc);
    lastRef.current = { type: "coords", lat, lon };
  };
  const runCityFlowSmart = async (name, controller) => {
    const opts = controller ? { signal: controller.signal } : {};
    const cur = await getByCity(name.trim(), { units, lang: "kr" }, opts);
    setData(cur);
    const { lat, lon } = cur.coord || {};
    if (lat == null || lon == null) throw new Error("좌표 정보를 찾을 수 없습니다.");
    save(keyCityIndex(normCity(name)), { lat, lon, name: cur.name, country: cur.sys?.country });
    const cacheState = showFromCacheIfAny(lat, lon, { silent: true });
    const needCurrent  = !cacheState.currentFresh;
    const needForecast = !cacheState.forecastFresh;
    if (needCurrent || needForecast) {
      await fetchByCoordsSmart(lat, lon, controller, { current: needCurrent, forecast: needForecast });
    } else {
      lastRef.current = { type: "coords", lat, lon };
    }
  };
  const writeCaches = (lat, lon, cur, fc) => {
    if (cur) save(keyCurrent(units, lat, lon), { ts: Date.now(), data: cur });
    if (fc)  save(keyForecast(units, lat, lon), { ts: Date.now(), data: fc });
    save(KEY_LAST_COORDS, { lat, lon });
  };
  const showFromCacheIfAny = (lat, lon, opts = { silent: false }) => {
    const curC = load(keyCurrent(units, lat, lon));
    const fcC  = load(keyForecast(units, lat, lon));
    let drew = false;
    if (curC?.data) { setData(curC.data); drew = true; }
    if (fcC?.data)  { setForecast(fcC.data); drew = true; }
    if (drew && !opts.silent) { /* 캐시로 채움 */ }
    return {
      hasCurrent: !!curC?.data,
      hasForecast: !!fcC?.data,
      currentFresh: fresh(curC, CACHE_TTL_MS_CURRENT),
      forecastFresh: fresh(fcC, CACHE_TTL_MS_FORECAST),
    };
  };

  // ====== 디바운스 자동조회 (기존) + a11y 포커스 ======
  useEffect(() => {
    if (!city.trim()) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (acRef.current) acRef.current.abort();
      const controller = new AbortController();
      acRef.current = controller;
      setErr(null);
      setForecast(null);
      try {
        const idx = load(keyCityIndex(normCity(city)));
        if (idx?.lat != null && idx?.lon != null) {
          const cstat = showFromCacheIfAny(idx.lat, idx.lon);
          if (!cstat.currentFresh || !cstat.forecastFresh) {
            setLoading(true);
            await fetchByCoordsSmart(idx.lat, idx.lon, controller, {
              current: !cstat.currentFresh,
              forecast: !cstat.forecastFresh,
            });
            setLoading(false);
          } else {
            lastRef.current = { type: "coords", lat: idx.lat, lon: idx.lon };
          }
        } else {
          setLoading(true);
          await runCityFlowSmart(city, controller);
          setLoading(false);
        }
        // 성공적으로 데이터가 있으면 결과 헤딩에 포커스
        setTimeout(() => { resultsHeadingRef.current?.focus(); }, 0);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(e);
          setData(null);
          setForecast(null);
          setLoading(false);
        }
      } finally {
        if (acRef.current === controller) acRef.current = null;
      }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [city, units]); // eslint-disable-line react-hooks/exhaustive-deps

  // ====== 단위 변경/초기 로드 (기존 로직) ======
  useEffect(() => {
    const srcRaw = lastRef.current || load(KEY_LAST_COORDS);
    if (!srcRaw) return;
    const { lat, lon } = srcRaw;
    const cstat = showFromCacheIfAny(lat, lon);
    if (!cstat.currentFresh || !cstat.forecastFresh) {
      (async () => {
        if (acRef.current) acRef.current.abort();
        const controller = new AbortController();
        acRef.current = controller;
        try {
          setLoading(!cstat.hasCurrent && !cstat.hasForecast);
          await fetchByCoordsSmart(lat, lon, controller, {
            current: !cstat.currentFresh,
            forecast: !cstat.forecastFresh,
          });
          setTimeout(() => { resultsHeadingRef.current?.focus(); }, 0);
        } catch (e) {
          if (e.name !== "AbortError") setErr(e);
        } finally {
          if (acRef.current === controller) acRef.current = null;
          setLoading(false);
        }
      })();
    } else {
      lastRef.current = { type: "coords", lat, lon };
    }
  }, [units]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const last = load(KEY_LAST_COORDS);
    if (!last) return;
    const { lat, lon } = last;
    const cstat = showFromCacheIfAny(lat, lon);
    if (!cstat.currentFresh || !cstat.forecastFresh) {
      (async () => {
        if (acRef.current) acRef.current.abort();
        const controller = new AbortController();
        acRef.current = controller;
        try {
          setLoading(!cstat.hasCurrent && !cstat.hasForecast);
          await fetchByCoordsSmart(lat, lon, controller, {
            current: !cstat.currentFresh,
            forecast: !cstat.forecastFresh,
          });
          setTimeout(() => { resultsHeadingRef.current?.focus(); }, 0);
        } catch (e) {
          if (e.name !== "AbortError") setErr(e);
        } finally {
          if (acRef.current === controller) acRef.current = null;
          setLoading(false);
        }
      })();
    } else {
      lastRef.current = { type: "coords", lat, lon };
    }
  }, []);

  useEffect(() => () => { if (acRef.current) acRef.current.abort(); }, []);

  // ====== 즉시 검색 / 내 위치 (기존) + a11y 포커스 ======
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (acRef.current) acRef.current.abort();
    const controller = new AbortController();
    acRef.current = controller;
    setErr(null);
    setForecast(null);

    const idx = load(keyCityIndex(normCity(city)));
    if (idx?.lat != null && idx?.lon != null) {
      const cstat = showFromCacheIfAny(idx.lat, idx.lon);
      try {
        if (!cstat.currentFresh || !cstat.forecastFresh) {
          setLoading(true);
          await fetchByCoordsSmart(idx.lat, idx.lon, controller, {
            current: !cstat.currentFresh,
            forecast: !cstat.forecastFresh,
          });
          setLoading(false);
        } else {
          lastRef.current = { type: "coords", lat: idx.lat, lon: idx.lon };
        }
        setTimeout(() => { resultsHeadingRef.current?.focus(); }, 0);
      } catch (e2) {
        if (e2.name !== "AbortError") { setErr(e2); setData(null); setForecast(null); }
      } finally {
        if (acRef.current === controller) acRef.current = null;
      }
      return;
    }

    try {
      setLoading(true);
      await runCityFlowSmart(city, controller);
      setLoading(false);
      setTimeout(() => { resultsHeadingRef.current?.focus(); }, 0);
    } catch (e3) {
      if (e3.name !== "AbortError") { setErr(e3); setData(null); setForecast(null); }
    } finally {
      if (acRef.current === controller) acRef.current = null;
      setLoading(false);
    }
  };

  const onMyLocation = () => {
    if (!navigator.geolocation) {
      setErr(new Error("이 브라우저는 위치 정보를 지원하지 않습니다."));
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (acRef.current) acRef.current.abort();
    setErr(null);
    setForecast(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const controller = new AbortController();
        acRef.current = controller;
        const { latitude, longitude } = pos.coords;
        const cstat = showFromCacheIfAny(latitude, longitude);
        try {
          if (!cstat.currentFresh || !cstat.forecastFresh) {
            setLoading(!cstat.hasCurrent && !cstat.hasForecast);
            await fetchByCoordsSmart(latitude, longitude, controller, {
              current: !cstat.currentFresh,
              forecast: !cstat.forecastFresh,
            });
          } else {
            lastRef.current = { type: "coords", lat: latitude, lon: longitude };
          }
          setTimeout(() => { resultsHeadingRef.current?.focus(); }, 0);
        } catch (e4) {
          if (e4.name !== "AbortError") { setErr(e4); setData(null); setForecast(null); }
        } finally {
          if (acRef.current === controller) acRef.current = null;
          setLoading(false);
        }
      },
      () => setErr(new Error("위치 권한을 허용해주세요.")),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ====== 렌더 ======
  const resultsRegionId = "weather-results";
  const loadingStatusId = "loading-status";
  const cityHintId = "city-hint";

// ... (상단 import와 로직은 당신의 최신 버전 그대로 두고)
  return (
    <div className="vstack" style={{gap:12}}>
      <div className="hstack" style={{justifyContent:"space-between"}}>
        <h1 style={{margin:0}}>Weather</h1>
        <span className="meta">3h forecast · geolocation · debounce + cache</span>
      </div>

      <form onSubmit={onSubmit} className="hstack card" style={{gap:8, alignItems:"end"}}>
        <div className="vstack" style={{gap:6}}>
          <label htmlFor="city">도시 이름</label>
          <input
            id="city"
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="예: Seoul, Tokyo, New York"
            aria-describedby={cityHintId}
            aria-controls={resultsRegionId}
            autoComplete="off"
          />
          <div id={cityHintId} className="meta">입력 멈춤 300ms 후 자동 조회</div>
        </div>

        <div className="vstack" style={{gap:6}}>
          <label htmlFor="unit-select">단위</label>
          <select id="unit-select" className="select" value={units} onChange={(e)=>setUnits(e.target.value)}>
            <option value="metric">°C</option>
            <option value="imperial">°F</option>
          </select>
        </div>

        <div className="hstack" style={{gap:8}}>
          <button type="submit" className="btn primary" aria-label="도시 검색">검색</button>
          <button type="button" className="btn" onClick={onMyLocation} aria-label="내 위치로 조회">내 위치</button>
        </div>
      </form>

      {loading && (
        <div role="status" aria-live="polite" aria-atomic="true" className="status">업데이트 중...</div>
      )}
      {err && (
        <div role="alert" className="alert">오류: {err.message}</div>
      )}

      <div id={resultsRegionId} aria-busy={loading ? "true" : "false"}>
        <section className="card">
          <WeatherCard data={data} iconUrl={iconUrl} headingRef={resultsHeadingRef} />
        </section>

        <section className="card" style={{marginTop:12}}>
          <ForecastList data={forecast} />
        </section>
      </div>
    </div>
  );
}