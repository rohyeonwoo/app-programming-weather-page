// src/components/WeatherCard.jsx
export default function WeatherCard({ data, iconUrl, headingRef }) {
  if (!data) return null;

  const w = data.weather?.[0];
  const main = data.main || {};
  const wind = data.wind || {};
  const tz = data.timezone ?? 0;

  const fmt = (sec) => new Date((sec + tz) * 1000).toLocaleTimeString();
  const icon = w?.icon ? `https://openweathermap.org/img/wn/${w.icon}@2x.png` : "";
  const titleId = `weather-title-${data.id ?? "now"}`;

  return (
    <section
      className="card"
      aria-labelledby={titleId}
      style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}
    >
      <h2
        id={titleId}
        ref={headingRef}
        tabIndex={-1}                // 포커스 이동 가능
        style={{ marginTop: 0, outline: "none" }}
      >
        {data.name} {data.sys?.country && `(${data.sys.country})`}
      </h2>

      <p style={{ margin: 0, color: "#555" }}>
        {w?.main} · {w?.description}
      </p>

      {/* 아이콘을 설명 캡션과 함께 묶기 */}
      {icon && (
        <figure style={{ margin: "8px 0" }}>
          <img
            src={icon}
            alt={w?.description ? `날씨 아이콘: ${w.description}` : "날씨 아이콘"}
            width={100}
            height={100}
          />
          <figcaption style={{ fontSize: 12, color: "#666" }}>
            {w?.main} {w?.description ? `· ${w.description}` : ""}
          </figcaption>
        </figure>
      )}

      <p style={{ fontSize: 36, margin: "8px 0" }} aria-label={`현재 기온 ${Math.round(main.temp)}도`}>
        {Math.round(main.temp)}°
      </p>

      <dl>
        <div>
          <dt className="sr-only" style={{ position: "absolute", left: -9999 }}>체감</dt>
          <dd>체감: {Math.round(main.feels_like)}°</dd>
        </div>
        <div>
          <dt className="sr-only" style={{ position: "absolute", left: -9999 }}>최저/최고</dt>
          <dd>최저/최고: {Math.round(main.temp_min)}° / {Math.round(main.temp_max)}°</dd>
        </div>
        <div>
          <dt className="sr-only" style={{ position: "absolute", left: -9999 }}>습도</dt>
          <dd>습도: {main.humidity}%</dd>
        </div>
        <div>
          <dt className="sr-only" style={{ position: "absolute", left: -9999 }}>풍속</dt>
          <dd>풍속: {wind?.speed ?? "-"} m/s</dd>
        </div>
      </dl>

      {data.sys?.sunrise && (
        <p>
          일출: <time dateTime={new Date((data.sys.sunrise + tz) * 1000).toISOString()}>{fmt(data.sys.sunrise)}</time> ·{" "}
          일몰: <time dateTime={new Date((data.sys.sunset + tz) * 1000).toISOString()}>{fmt(data.sys.sunset)}</time>
        </p>
      )}

      <p style={{ color: "#777" }}>
        측정 시각: <time dateTime={new Date((data.dt + tz) * 1000).toISOString()}>{fmt(data.dt)}</time>
      </p>
    </section>
  );
}
