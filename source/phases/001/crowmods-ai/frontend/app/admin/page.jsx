export default function Admin() {
  return (
    <main style={{minHeight: "100vh", background: "#08080b", color: "#fff", padding: 40}}>
      <h1>CrowMods AI — Admin</h1>
      <section style={{marginTop: 30}}>
        <h2>Upload</h2>
        <input type="file" accept=".apk" />
        <p>Phase 1: upload pipeline will be connected to the secure backend next.</p>
      </section>
      <section style={{marginTop: 30}}>
        <h2>Pending approvals</h2>
        <p>No releases pending.</p>
      </section>
    </main>
  );
}
