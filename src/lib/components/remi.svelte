<script lang="ts">
	import remiImage from '$lib/assets/remi.png';
</script>

<button class="width-16">
	<img alt="Remi" src={remiImage} class="chip-container h-auto w-16" />
</button>

<style>
	.chip-container {
		position: fixed;
		bottom: 30px;
		z-index: 1000;
		right: 15px;
	}
</style>
