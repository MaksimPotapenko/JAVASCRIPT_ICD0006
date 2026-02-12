const input = document.getElementById("commandInput");
const output = document.getElementById("output");
const btn = document.getElementById("runBtn");

btn.addEventListener("click", () => {
  const cmd = input.value.trim();
  output.textContent = "Command: " + cmd;
});
