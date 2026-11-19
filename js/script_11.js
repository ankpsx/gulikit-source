function setMinHeight() {
	const viewportHeight = window.innerHeight; // 获取视口高度188  124
	const myElement = document.getElementById("gamePayId");
	const container = document.getElementById("container");
	if (myElement) {
		myElement.style.minHeight = `${viewportHeight -104}px`;
	}
	if (container) {
		container.style.minHeight = `${viewportHeight -104}px`; // 设置最小高度为视口高度的一半
	}
	const loadId = document.getElementById("loadId");
	if (loadId) {
		loadId.style.minHeight = `${viewportHeight -104}px`; // 设置最小高度为视口高度的一半
	}
	const settingLoadId = document.getElementById("settingLoadId");
	if (settingLoadId) {
		settingLoadId.style.minHeight = `${viewportHeight -104}px`; // 设置最小高度为视口高度的一半
	}
}

// 初始设置
setMinHeight();

// 监听窗口大小变化
window.addEventListener('resize', setMinHeight);