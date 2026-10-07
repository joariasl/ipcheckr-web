document.addEventListener("click", async (e) => {
  const block = e.target.closest(".copyable");
  if (!block) return;

  const text = block.textContent!.trim();
  if (!text) return;

  if (block.classList.contains("copied")) return;

  try {
    await navigator.clipboard.writeText(text);
    block.classList.add("copied");

    const msg = document.createElement("span");
    msg.className = "copy-msg";
    msg.textContent = "✅ Copied!";
    block.insertAdjacentElement("afterend", msg);
    
    setTimeout(() => {
      block.classList.remove("copied");
      msg.remove();
    }, 1500);
  } catch (err) {
    console.error("Error copying to clipboard:", err);
  }
});
