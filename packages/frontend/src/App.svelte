<script lang="ts">
import './app.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { router } from 'tinro';
import Route from '/@/Route.svelte';
import Dashboard from '/@/pages/Dashboard.svelte';

import { onMount } from 'svelte';
import { getRouterState } from '/@/utils/client';

router.mode.hash();

let isMounted = false;

onMount(() => {
  // Load router state on application startup
  const state = getRouterState();
  router.goto(state.url);
  isMounted = true;
});
</script>

<Route path="/*" isAppMounted="{isMounted}" let:meta>
  <main class="flex flex-col w-screen h-screen overflow-hidden bg-charcoal-700">
    <div class="flex flex-row w-full h-full overflow-hidden">
      <!-- Dashboard -->
      <Route path="/">
        <Dashboard />
      </Route>
    </div>
  </main>
</Route>
