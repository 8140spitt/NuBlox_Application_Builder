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
	<link rel="icon" type="image/png" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
			<a class="btn ghost" href="./" rel="noopener">Follow NuBlox</a>
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
				<a class="btn" href="http://localhost:5174/register">Get Started</a>
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
