// results.js

let resultsData = [];

document.addEventListener('DOMContentLoaded', () => {
  const stored = sessionStorage.getItem('pathifyResults');
  if (!stored) {
    // If accessed directly without data, bounce to index
    window.location.href = 'index.html';
    return;
  }
  
  try {
    const parsed = JSON.parse(stored);
    resultsData = parsed.results;
    if (!resultsData || !Array.isArray(resultsData)) throw new Error("Invalid format");
  } catch (e) {
    console.error(e);
    window.location.href = 'index.html';
    return;
  }
  
  // Sort by rank just in case
  resultsData.sort((a, b) => a.rank - b.rank);
  
  // Enforce frontend constraints just in case AI missed them:
  // Nearest 5, Min 55, Max 95, no duplicates
  const seenPcts = new Set();
  resultsData.forEach(item => {
    let pct = Math.round(item.percentage / 5) * 5;
    if (pct > 95) pct = 95;
    if (pct < 55) pct = 55;
    while (seenPcts.has(pct) && pct > 55) {
      pct -= 5;
    }
    seenPcts.add(pct);
    item.percentage = pct;
  });
  
  renderCards();
});

function getRankLabel(rank) {
  if (rank === 1) return "#1 Best Match";
  if (rank === 2) return "#2 Strong Fit";
  return "#3 Worth Exploring";
}

function renderCards() {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  
  resultsData.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = `r-card ${item.rank === 1 ? 'rank-1' : ''}`;
    
    // Animate in staggered
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';
    
    // Construct HTML
    card.innerHTML = `
      <div class="r-rank">${getRankLabel(item.rank)}</div>
      <div class="r-field">${item.field}</div>
      <div class="r-pct">${item.percentage}%</div>
      <div class="r-desc">${item.type || 'Recommended specialization'}</div>
      
      <div class="r-bar-wrap">
        <div class="r-bar-fill" style="width: 0%" data-target="${item.percentage}"></div>
      </div>
      
      <a href="#" class="r-link">See full breakdown &rarr;</a>
    `;
    
    // On click
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(item);
    });
    
    grid.appendChild(card);
    
    // Animate intro
    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease, border-color 0.3s ease';
      card.style.opacity = 1;
      card.style.transform = item.rank === 1 && window.innerWidth > 640 ? 'scale(1.02)' : 'translateY(0)';
      
      // Animate bar
      setTimeout(() => {
        const bar = card.querySelector('.r-bar-fill');
        if(bar) bar.style.width = `${item.percentage}%`;
      }, 300);
      
    }, 100 + (idx * 150));
  });
}

const modal = document.getElementById('modal');
const backdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');

function openModal(item) {
  document.getElementById('m-rank').textContent = item.rank === 1 ? 'Top match' : `Rank #${item.rank}`;
  document.getElementById('m-field').textContent = item.field;
  document.getElementById('m-pct').textContent = `${item.percentage}%`;
  document.getElementById('m-desc').textContent = item.explanation;
  
  // Strengths
  const strengthsRow = document.getElementById('m-strengths');
  strengthsRow.innerHTML = '';
  if (item.strengths && item.strengths.length) {
    item.strengths.forEach(s => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = s;
      strengthsRow.appendChild(tag);
    });
  } else {
    strengthsRow.innerHTML = '<span class="tag">Not specified</span>';
  }
  
  // Considerations
  const considerationsRow = document.getElementById('m-considerations');
  considerationsRow.innerHTML = '';
  if (item.considerations && item.considerations.length) {
    item.considerations.forEach(c => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = c;
      considerationsRow.appendChild(tag);
    });
  } else {
    considerationsRow.innerHTML = '<span class="tag">Not specified</span>';
  }
  
  // Roles — dynamically create or update
  let rolesContainer = document.querySelector('.modal-roles');
  if (rolesContainer) rolesContainer.remove();
  
  if (item.roles && item.roles.length) {
    rolesContainer = document.createElement('div');
    rolesContainer.className = 'modal-roles';
    rolesContainer.innerHTML = `
      <div class="modal-section-title">Roles you could grow into</div>
      <div class="tags-row roles">
        ${item.roles.map(r => `<span class="role-tag">${r}</span>`).join('')}
      </div>
    `;
    // Insert before modal-footer
    const footer = document.querySelector('.modal-footer');
    if (footer) {
      footer.before(rolesContainer);
    } else {
      document.querySelector('.modal-content').appendChild(rolesContainer);
    }
  }

  modal.classList.add('active');
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
