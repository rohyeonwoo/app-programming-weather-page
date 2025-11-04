export default function PostsList() {
  const posts = [
    { id:1, title:"오늘의 날씨 팁", desc:"도시명 자동 검색, 3시간 예보, 단위 전환을 지원합니다."},
    { id:2, title:"디바운스 & 캐시", desc:"입력 멈춤 300ms 후 조회, localStorage로 즉시표시 + TTL 갱신."},
    { id:3, title:"접근성(A11y)", desc:"role=status/alert, aria-busy, 포커스 관리로 스크린리더 친화."},
  ];
  return (
    <div className="grid">
      <section className="card vstack" style={{gridColumn:"span 12"}}>
        <h1 style={{margin:0}}>Welcome 👋</h1>
        <p className="meta">간단한 예제지만 구조/접근성/성능까지 챙긴 React 날씨 앱</p>
        <div className="hstack" style={{gap:8}}>
          <a className="btn primary" href="/weather">바로 날씨 보기</a>
          <a className="btn" href="https://openweathermap.org/" target="_blank" rel="noreferrer">OpenWeather</a>
        </div>
      </section>

      {posts.map(p=>(
        <article key={p.id} className="card" style={{gridColumn:"span 4"}}>
          <div className="badge">Guide</div>
          <h3 style={{margin:"6px 0 4px"}}>{p.title}</h3>
          <p className="meta" style={{margin:0}}>{p.desc}</p>
        </article>
      ))}
    </div>
  );
}