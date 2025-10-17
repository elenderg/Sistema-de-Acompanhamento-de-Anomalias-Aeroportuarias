// Pequeno script para interatividade: toggle visibilidade da senha, validação básica, força da senha
    (function(){
      const form = document.getElementById('loginForm');
      const pwd = document.getElementById('password');
      const toggle = document.getElementById('togglePwd');
      const eyeOpen = document.getElementById('eyeOpen');
      const eyeClosed = document.getElementById('eyeClosed');
      const pwdBar = document.getElementById('pwdBar');
      const submitBtn = document.getElementById('submitBtn');
      const email = document.getElementById('email');

      toggle.addEventListener('click', ()=>{
        if(pwd.type === 'password'){
          pwd.type = 'text';
          eyeOpen.classList.add('hidden');
          eyeClosed.classList.remove('hidden');
          toggle.setAttribute('aria-label', 'Ocultar senha');
        } else {
          pwd.type = 'password';
          eyeOpen.classList.remove('hidden');
          eyeClosed.classList.add('hidden');
          toggle.setAttribute('aria-label', 'Mostrar senha');
        }
      });

      // força simples: comprimento + variedade de caracteres
      function calcStrength(value){
        let score = 0;
        if(!value) return 0;
        if(value.length >= 8) score += 1;
        if(/[A-Z]/.test(value)) score += 1;
        if(/[a-z]/.test(value)) score += 1;
        if(/[0-9]/.test(value)) score += 1;
        if(/[^A-Za-z0-9]/.test(value)) score += 1;
        return Math.min(score,5);
      }

      function updateBar(){
        const s = calcStrength(pwd.value);
        const percent = (s/5)*100;
        pwdBar.style.width = percent + '%';
        // mudar cor via classes tailwind (inline style por simplicidade)
        if(percent < 40) {
          pwdBar.style.background = 'linear-gradient(90deg,#fb7185,#f97316)'; // fraco
        } else if(percent < 80) {
          pwdBar.style.background = 'linear-gradient(90deg,#f59e0b,#f97316)'; // médio
        } else {
          pwdBar.style.background = 'linear-gradient(90deg,#10b981,#06b6d4)'; // forte
        }
      }

      pwd.addEventListener('input', updateBar);
      // validações no submit (só front-end: não substitui validação server-side)
      form.addEventListener('submit', (ev)=>{
        ev.preventDefault();
        const em = email.value.trim();
        const pw = pwd.value;

        // email simples
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailPattern.test(em)){
          email.focus();
          email.setCustomValidity('Por favor insira um e-mail válido.');
          email.reportValidity();
          return;
        } else {
          email.setCustomValidity('');
        }

        if(pw.length < 8){
          pwd.focus();
          pwd.setCustomValidity('A senha deve ter pelo menos 8 caracteres.');
          pwd.reportValidity();
          return;
        } else {
          pwd.setCustomValidity('');
        }

        // Simula envio
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70');
        submitBtn.innerHTML = 'Entrando...';

        setTimeout(()=>{
          // aqui você chamaria fetch() para seu backend
          alert('Autenticação simulada: e-mail='+em+' (não envie senhas reais neste protótipo)');
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-70');
          submitBtn.innerHTML = '<span class="inline-block bg-clip-text text-transparent" style="background:var(--accent); -webkit-background-clip: text;">Entrar</span>';
        }, 900);
      });

      // acessibilidade: limpar mensagens custom validity ao digitar
      email.addEventListener('input', ()=> email.setCustomValidity(''));
      pwd.addEventListener('input', ()=> pwd.setCustomValidity(''));

      // tooltip via keyboard: mostra tooltip quando focado
      const helpBtn = document.getElementById('helpBtn');
      helpBtn.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') e.preventDefault(); });

      // inicializa barra
      updateBar();
    })();