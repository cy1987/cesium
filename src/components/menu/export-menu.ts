let counter = 0;

export function exportMenu(list: any) {
    // counter++;
    // setTimeout(() => {
    //     counter = 0;
    // }, 2000);
    // if (counter < 2) return;
    // counter = 0;
    // console.log(list);
    // console.log(JSON.stringify(list));

    let data = JSON.stringify(list);
    let blob = new Blob([data], { type: "text/json" });
    let dom = document.createElement("a");
    let objectUrl = URL.createObjectURL(blob);
    dom.href = objectUrl;
    dom.download = "menu.json";
    dom.style.display = "none";
    document.body.appendChild(dom);
    dom.target = "_blank";
    dom.click();
    (<any>dom.parentNode).removeChild(dom);
    window.URL.revokeObjectURL(objectUrl);
}
