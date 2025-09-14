<script lang="ts">
	export let data: { user: { id: number; username: string } };
</script>

<section class="p-6 space-y-2">
	<h1 class="text-2xl font-semibold">My Profile</h1>
	<p class="opacity-70">Signed in as <strong>{data.user.username}</strong></p>
</section>
