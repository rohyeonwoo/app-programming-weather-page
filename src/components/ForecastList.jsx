// src/components/ForecastList.jsx
export default function ForecastList({ data }) {
  if (!data?.list?.length) return null;

  const items = Array.isArray(data.list) ? data.list : [];

  // 🔧 titleId를 먼저 선언
  const titleId = "forecast-title";

  // 날짜별 그룹핑
  const groups = items.reduce((acc, it) => {
    const key = (it.dt_txt || "").slice(0, 10); // YYYY-MM-DD
    (acc[key] ||= []).push(it);
    return acc;
  }, {});

  return (
    <section aria-labelledby={titleId} style={{ marginTop: 0 }}>
      <h2 id={titleId} style={{ margin: 0 }}>
        5일 예보 · {data.city?.name} {data.city?.country && `(${data.city.country})`}
      </h2>

      <ul role="list" aria-label="날짜별 3시간 간격 예보" style={{ padding: 0, listStyle: "none" }}>
        {Object.entries(groups).map(([dateKey, arr]) => (
          <li key={dateKey} className="forecast-day">
            <h3 style={{ margin: "4px 0 8px" }}>
              <time dateTime={dateKey}>{dateKey}</time>
            </h3>

            <ul role="list" className="forecast-grid" style={{ padding: 0, listStyle: "none" }}>
              {arr.map((it) => {
                const w = it.weather?.[0];
                const icon = w?.icon ? `https://openweathermap.org/img/wn/${w.icon}@2x.png` : "";
                const timeStr = it.dt_txt ? it.dt_txt.slice(11, 16) : "";
                const dtISO = it.dt ? new Date(it.dt * 1000).toISOString() : undefined;
                const temp = Math.round(it.main?.temp);

                return (
                  <li key={it.dt_txt || it.dt} className="forecast-item">
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {it.dt_txt ? (
                        <time dateTime={it.dt_txt.replace(" ", "T")}>{timeStr}</time>
                      ) : (
                        <time dateTime={dtISO}>{timeStr}</time>
                      )}
                    </div>

                    {icon && (
                      <img
                        src={icon}
                        width={64}
                        height={64}
                        alt={w?.description ? `예보 아이콘: ${w.description}` : "예보 아이콘"}
                        style={{ display: "block" }}
                      />
                    )}

                    <div aria-label={`예보 기온 ${temp}도`} style={{ fontSize: 20, fontWeight: 600 }}>
                      {temp}°
                    </div>
                    <div style={{ color: "#666" }}>
                      {w?.main} {w?.description && `· ${w.description}`}
                    </div>

                    <dl style={{ marginTop: 6 }}>
                      <div>
                        <dt className="sr-only" style={{ position: "absolute", left: -9999 }}>체감</dt>
                        <dd style={{ margin: 0, fontSize: 12, color: "#666" }}>
                          체감 {Math.round(it.main?.feels_like)}°
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only" style={{ position: "absolute", left: -9999 }}>습도</dt>
                        <dd style={{ margin: 0, fontSize: 12, color: "#666" }}>
                          습도 {it.main?.humidity}%
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only" style={{ position: "absolute", left: -9999 }}>풍속</dt>
                        <dd style={{ margin: 0, fontSize: 12, color: "#666" }}>
                          풍속 {it.wind?.speed} m/s
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}