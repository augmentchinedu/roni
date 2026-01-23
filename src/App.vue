<template>
  <h1>Welcome to {{ appName }}!</h1>
  <RouterView />
</template>

<script>
export default {
  data() {
    return {
      appName: PROJECT.id,
    };
  },
};
</script>

<style>
h1 {
  color: #4caf50;
  font-family: sans-serif;
}
</style>
