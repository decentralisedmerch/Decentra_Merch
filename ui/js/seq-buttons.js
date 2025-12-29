document.addEventListener('DOMContentLoaded', () => {
const container = document.createElement('div');
container.style.position = 'fixed';
container.style.right = '18px';
container.style.bottom = '18px';
container.style.zIndex = '99999';
container.style.display = 'flex';
container.style.flexDirection = 'column';

async function triggerSeq(id) {
  console.log('🔵 Button clicked, seq ID:', id);
  try {
    // Use relative path - works with both local dev and Vercel
    const url = '/api/device/trigger-seq';
    console.log('🔵 Sending POST to:', url);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    console.log('🔵 Response status:', resp.status);
    const text = await resp.text();
    console.log('🔵 Response text:', text.substring(0, 200));
    
    try {
      const j = JSON.parse(text);
        console.log('✅ SEQ response:', j);
        if (j.ok) {
          console.log('✅ Message sent successfully!');
          console.log('🔊 Audio will play on device speaker (not browser)');
          
          // Show visual feedback
          const btn = document.querySelector(`[data-seq-id="${id}"]`);
          if (btn) {
            btn.style.background = '#10b981';
            setTimeout(() => { btn.style.background = ''; }, 500);
          }
        } else {
        console.error('❌ Server returned error:', j);
        alert('Failed: ' + (j.reason || JSON.stringify(j)));
      }
    } catch (e) {
      console.error('❌ JSON parse error:', e, 'Text:', text);
      alert('Server error: ' + text.substring(0, 100));
    }
  } catch (e) {
    console.error('❌ Network error:', e);
    alert('Network error: ' + e.message);
  }
}

for (let id=1; id<=4; id++) {
const btn = document.createElement('button');
btn.textContent = id;
btn.style.margin = '6px';
btn.dataset.seqId = id;
btn.className = 'seq-btn';
btn.onclick = async (e) => {
const seqId = Number(e.target.dataset.seqId);
await triggerSeq(seqId);
};
container.appendChild(btn);
}
document.body.appendChild(container);
});
