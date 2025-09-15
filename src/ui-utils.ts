document.querySelectorAll(".ip-card span").forEach(block => {
  block.addEventListener("click", async () => {
    const text = block.textContent!.trim();
    if (!text) return;

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
      console.error("Error copiando:", err);
    }
  });
});
