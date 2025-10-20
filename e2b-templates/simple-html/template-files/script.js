// JavaScript functionality

document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("demo-button");
    const output = document.getElementById("demo-output");

    let clickCount = 0;

    button.addEventListener("click", () => {
        clickCount++;
        output.textContent = `Button clicked ${clickCount} time${clickCount !== 1 ? "s" : ""}!`;
        output.classList.add("text-blue-600", "font-semibold");
    });

    console.log("Website loaded successfully!");
});

// Add your custom JavaScript here
