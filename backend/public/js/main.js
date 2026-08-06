// PBL 科创育人平台 - 前端脚本

// 自动隐藏 flash 消息
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 4000);
  });
});

// 文件上传预览
const fileInput = document.querySelector('input[type="file"]');
if (fileInput) {
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const hint = document.querySelector('.form-hint') || document.createElement('p');
      hint.className = 'form-hint';
      hint.innerHTML = `已选择：${file.name}（${sizeMB} MB）`;
      if (!document.querySelector('.form-hint')) {
        fileInput.parentNode.appendChild(hint);
      }
    }
  });
}
