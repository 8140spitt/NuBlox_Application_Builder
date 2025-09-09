<script lang="ts">
	function scrollToId(id: string) {
		const el = document.getElementById(id);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<svelte:head>
	<title>NuBlox — Build Full-Stack Applications Visually</title>
	<meta
		name="description"
		content="Design your database, build your UI, and automate logic in one seamless platform. No code required. Deploy instantly with NuBlox."
	/>
	<meta property="og:title" content="NuBlox — Build Full-Stack Applications Visually" />
	<meta
		property="og:description"
		content="SQL Designer • UI Builder • Logic Studio • API Studio • DevOps. From schema to screen — no code, no compromise."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<!-- HERO -->
<header class="hero">
	<div class="wrap">
		<div class="badge">NuBlox Marketing Suite</div>
		<h1>Build Full-Stack Applications Visually</h1>
		<p class="sub">
			Design your database. Build your UI. Automate your logic.<br />All from a single, unified
			platform — with zero code.
		</p>
		<div class="cta-row">
			<button class="btn" on:click={() => scrollToId('get-started')}>Get Started for Free</button>
			<button class="btn ghost" on:click={() => scrollToId('demo')}>Watch Demo</button>
		</div>

		<ul class="bullets">
			<li>✅ Visual ERD + schema migration</li>
			<li>✅ Drag-and-drop UI designer</li>
			<li>✅ Visual business logic workflows</li>
			<li>✅ Auto-generated & testable APIs</li>
			<li>✅ One-click deploy to any environment</li>
		</ul>
	</div>
</header>

<!-- MODULES -->
<section class="section" id="modules">
	<div class="wrap">
		<h2>Key Modules</h2>
		<div class="grid cards">
			<!-- SQL Studio -->
			<article class="card">
				<h3>🔢 SQL Studio</h3>
				<p class="lede">Design your schema visually.</p>
				<ul>
					<li>Visual ERD builder (MySQL, PostgreSQL, SQLite)</li>
					<li>Reverse-engineer existing databases</li>
					<li>Forward-generate SQL scripts</li>
					<li>Schema diffing & versioning</li>
					<li>Real-time collaborative modeling</li>
				</ul>
			</article>

			<!-- UI Builder -->
			<article class="card">
				<h3>🌈 UI Builder</h3>
				<p class="lede">Build pixel-perfect interfaces.</p>
				<ul>
					<li>Precision visual component editor</li>
					<li>Reusable templates & themes</li>
					<li>Live data bindings to schema</li>
					<li>Optional HTML/CSS/JS injections for pros</li>
					<li>Fully responsive out of the box</li>
				</ul>
			</article>

			<!-- Logic Studio -->
			<article class="card">
				<h3>🔄 Logic Studio</h3>
				<p class="lede">Logic without code.</p>
				<ul>
					<li>Triggers: form submits, login, data changes</li>
					<li>Action chains: CRUD, email/SMS, fetch API</li>
					<li>Conditions, loops, expressions</li>
					<li>Schedules & webhooks</li>
				</ul>
			</article>

			<!-- API Studio -->
			<article class="card">
				<h3>🔍 API Studio</h3>
				<p class="lede">Click to deploy. Click to test.</p>
				<ul>
					<li>Instant CRUD endpoints per table/view</li>
					<li>Integrated API test runner with live previews</li>
					<li>OAuth2, JWT, and API key support</li>
					<li>GraphQL-ready (roadmap)</li>
					<li>Connector templates for external APIs</li>
				</ul>
			</article>

			<!-- DevOps -->
			<article class="card">
				<h3>🚀 DevOps Studio</h3>
				<p class="lede">Preview. Deploy. Isolate.</p>
				<ul>
					<li>Secrets & config per environment</li>
					<li>Per-project preview URLs</li>
					<li>Multi-tenant runtime isolation</li>
					<li>Docker & GitOps compatible</li>
				</ul>
			</article>

			<!-- Data Browser -->
			<article class="card">
				<h3>📊 Data Browser</h3>
				<p class="lede">See your data in action.</p>
				<ul>
					<li>Spreadsheet-style editor</li>
					<li>CSV/Excel import/export</li>
					<li>Live joins & relationships</li>
					<li>Embeddable viewer widgets</li>
				</ul>
			</article>
		</div>
	</div>
</section>

<!-- ROADMAP -->
<section class="section" id="roadmap">
	<div class="wrap">
		<h2>Product Roadmap</h2>
		<div class="grid roadmap">
			<article class="road">
				<h4>Alpha</h4>
				<ul>
					<li>SQL Studio</li>
					<li>Basic UI Builder</li>
					<li>ERD save/load</li>
				</ul>
			</article>
			<article class="road">
				<h4>Beta</h4>
				<ul>
					<li>Logic Studio</li>
					<li>Deployment</li>
					<li>API Studio</li>
					<li>Auth support</li>
				</ul>
			</article>
			<article class="road">
				<h4>v1.0</h4>
				<ul>
					<li>Multi-user collaboration</li>
					<li>Plugin marketplace</li>
					<li>Theme editor</li>
				</ul>
			</article>
			<article class="road">
				<h4>Future</h4>
				<ul>
					<li>AI assistant</li>
					<li>GraphQL support</li>
					<li>White-labeled runtime</li>
				</ul>
			</article>
		</div>
	</div>
</section>

<!-- DEMO -->
<section class="section alt" id="demo">
	<div class="wrap">
		<h2>See it in action</h2>
		<p class="sub tight">
			Build full-stack apps visually — no code, no compromises.<br />
			SQL Designer • UI Builder • API Studio • Workflow Engine
		</p>
		<div class="cta-row">
			<button class="btn" on:click={() => scrollToId('get-started')}>Try NuBlox Free</button>
			<a class="btn ghost" href="#" rel="noopener">Follow NuBlox</a>
		</div>
	</div>
</section>

<!-- CTA -->
<section class="section" id="get-started">
	<div class="wrap">
		<div class="cta-box">
			<h2>From schema to screen — no code, no compromise.</h2>
			<p>
				Build your first full-stack app in under 10 minutes. No engineers required — but engineers
				will love it.
			</p>
			<div class="cta-row">
				<a class="btn" href="/signup">Get Started</a>
				<a class="btn ghost" href="/docs">Read the Docs</a>
			</div>
		</div>
	</div>
</section>

<footer class="footer">
	<div class="wrap">
		<div class="foot-grid">
			<div>
				<div class="logo">NuBlox</div>
				<p class="muted">The future of full-stack is visual.</p>
			</div>
			<nav>
				<a href="#modules">Modules</a>
				<a href="#roadmap">Roadmap</a>
				<a href="#get-started">Get Started</a>
			</nav>
		</div>
		<div class="fine">© {new Date().getFullYear()} NuBlox. All rights reserved.</div>
	</div>
</footer>

<style>
	:root {
		--bg: #0b0d12;
		--card: #11151f;
		--alt: #0d121c;
		--text: #e8eef7;
		--muted: #9fb0c5;
		--acc: #4ea1ff;
		--acc2: #1f7ae0;
		--border: #1c2432;
		--ok: #12b886;
		--round: 16px;
		--shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.03);
	}
	* {
		box-sizing: border-box;
	}
	html,
	body {
		height: 100%;
	}
	body {
		margin: 0;
		background: radial-gradient(1200px 800px at 0% -10%, #0e1421, #0b0d12 40%), var(--bg);
		color: var(--text);
		font:
			15px/1.55 Inter,
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			'Helvetica Neue',
			Arial;
	}
	.wrap {
		max-width: 1140px;
		margin: 0 auto;
		padding: 0 20px;
	}
	.hero {
		padding: 92px 0 48px;
		border-bottom: 1px solid var(--border);
	}
	.badge {
		display: inline-block;
		padding: 6px 10px;
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--muted);
		margin-bottom: 12px;
	}
	h1 {
		font-size: 44px;
		line-height: 1.05;
		margin: 6px 0 10px;
		letter-spacing: 0.2px;
	}
	.sub {
		color: var(--muted);
		font-size: 18px;
		margin: 0 0 18px;
	}
	.sub.tight {
		margin-top: 6px;
	}
	.cta-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.btn {
		background: linear-gradient(180deg, var(--acc), var(--acc2));
		color: #fff;
		border: 0;
		padding: 12px 16px;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 700;
	}
	.btn:hover {
		filter: brightness(1.05);
	}
	.btn.ghost {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text);
	}
	.btn.ghost:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.bullets {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 8px;
		margin: 24px 0 0;
		padding: 0;
		list-style: none;
		color: #cfe3ff;
	}
	.section {
		padding: 56px 0;
	}
	.section.alt {
		background: var(--alt);
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}
	h2 {
		font-size: 28px;
		margin: 0 0 18px;
	}
	.grid.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 14px;
	}
	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--round);
		padding: 16px;
		box-shadow: var(--shadow);
	}
	.card .lede {
		color: #d7e9ff;
		margin: 0.25rem 0 0.5rem;
	}
	.card ul {
		margin: 0.25rem 0 0 1.1rem;
	}
	.table-wrap {
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: 12px;
	}
	.grid.roadmap {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 12px;
	}
	.road {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 14px;
		box-shadow: var(--shadow);
	}
	.road h4 {
		margin: 0 0 8px;
	}
	.cta-box {
		background: linear-gradient(180deg, #111a2a, #0f1624);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 22px;
		box-shadow: var(--shadow);
		text-align: center;
	}
	.footer {
		padding: 28px 0 40px;
		border-top: 1px solid var(--border);
		background: #0a0e15;
	}
	.foot-grid {
		display: flex;
		gap: 20px;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
	}
	.logo {
		font-weight: 900;
		font-size: 18px;
		letter-spacing: 0.4px;
	}
	nav a {
		color: var(--text);
		text-decoration: none;
		margin-right: 14px;
	}
	nav a:hover {
		color: #cfe3ff;
	}
	.muted {
		color: var(--muted);
	}
	.fine {
		color: var(--muted);
		margin-top: 10px;
		font-size: 13px;
		text-align: center;
	}
	@media (max-width: 820px) {
		h1 {
			font-size: 36px;
		}
		.sub {
			font-size: 16px;
		}
	}
</style>
