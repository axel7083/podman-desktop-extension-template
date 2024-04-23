<script lang="ts">
import { counters } from '/@/stores/counters';
import Button from '/@/lib/button/Button.svelte';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { extensionApiClient } from '/@/utils/client';
</script>

<div class="flex w-full items-center justify-center">
  {#each $counters as counter (counter.id)}
    <div class="flex">
      <Button title="decrement" on:click={() => extensionApiClient.decrementCounter(counter.id)} icon="{faMinus}"/>
      <div class="mx-2">{counter.value}</div>
      <Button title="increment" on:click={() => extensionApiClient.incrementCounter(counter.id)} icon="{faPlus}"/>
    </div>
  {/each}
</div>
