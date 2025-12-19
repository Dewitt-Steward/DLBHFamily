(function(){
  function toArr(nl){ return Array.prototype.slice.call(nl || []); }
  function qs(root, sel){ return root.querySelector(sel); }
  function qsa(root, sel){ return toArr(root.querySelectorAll(sel)); }

  function safeText(v){
    v = (v == null) ? '' : String(v);
    return v.trim();
  }

  function pad5(n){
    n = String(n || '');
    while(n.length < 5) n = '0' + n;
    return n.slice(-5);
  }

  function yyyymmdd(d){
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth()+1).padStart(2,'0');
    var dd = String(d.getDate()).padStart(2,'0');
    return '' + yyyy + mm + dd;
  }

  function init(root){
    if(root.__wizard_init) return;
    root.__wizard_init = true;

    var form  = qs(root, 'form');
    var steps = qsa(root, '[data-step]');
    var label = qs(root, '[data-progress-label]');
    var bar   = qs(root, '[data-progress-bar]');
    var idx   = 0;

    function blurActive(){
      try{
        var ae = document.activeElement;
        if(ae && root.contains(ae) && ae.blur) ae.blur();
      }catch(e){}
    }

    function validateCurrentStep(){
      var stepEl = steps[idx];
      if(!stepEl) return true;

      var fields = qsa(stepEl, 'input, select, textarea');
      for(var i=0; i<fields.length; i++){
        var f = fields[i];
        if(!f || f.disabled) continue;

        if(typeof f.checkValidity === 'function' && !f.checkValidity()){
          if(typeof f.reportValidity === 'function') f.reportValidity();
          else f.focus();
          return false;
        }
      }
      return true;
    }

    function getFieldValueByName(name){
      var el = qs(root, '[name="' + name + '"]');
      if(!el) return '';
      if(el.tagName === 'SELECT'){
        return safeText(el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : el.value);
      }
      return safeText(el.value);
    }

    function renderReview(){
      var tbody = qs(root, '[data-review-household-body]');
      if(tbody){
        tbody.innerHTML = '';

        for(var i=1; i<=6; i++){
          var rel = getFieldValueByName('household['+i+'][relationship]') || (i===1 ? 'Self' : '');
          var title = getFieldValueByName('household['+i+'][title]');
          var fn = getFieldValueByName('household['+i+'][first_name]');
          var ln = getFieldValueByName('household['+i+'][last_name]');
          var suffix = getFieldValueByName('household['+i+'][suffix]');
          var allergies = getFieldValueByName('household['+i+'][allergies]');
          var mil = getFieldValueByName('household['+i+'][military_status]');
          var tee = getFieldValueByName('household['+i+'][tshirt_size]');

          var any =
            safeText(rel) || safeText(title) || safeText(fn) || safeText(ln) ||
            safeText(suffix) || safeText(allergies) || safeText(mil) || safeText(tee);

          if(!any) continue;
          if(i !== 1 && !safeText(fn) && !safeText(ln) && !safeText(rel)) continue;

          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + (rel || '') + '</td>' +
            '<td>' + (title || '') + '</td>' +
            '<td>' + (fn || '') + '</td>' +
            '<td>' + (ln || '') + '</td>' +
            '<td>' + (suffix || '') + '</td>' +
            '<td>' + (allergies || '') + '</td>' +
            '<td>' + (mil || '') + '</td>' +
            '<td>' + (tee || '') + '</td>';

          tbody.appendChild(tr);
        }

        if(!tbody.children.length){
          var tr0 = document.createElement('tr');
          tr0.innerHTML = '<td colspan="8">No household entries entered yet.</td>';
          tbody.appendChild(tr0);
        }
      }

      qsa(root, '[data-review]').forEach(function(node){
        var name = node.getAttribute('data-review');
        node.textContent = getFieldValueByName(name);
      });
    }

    function renderConfirmation(){
      var now = new Date();
      var digits = pad5(Math.floor(Math.random() * 99999) + 1);

      var submissionId = 'ME-' + yyyymmdd(now) + '-' + digits;
      var orderDate = now.toLocaleString([], {
        year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'
      });

      var familyId = 'DLBH-' + digits;
      var duesText = '$20.00 per month (Household) — ' + now.getFullYear() + ' Dues';

      var firstName =
        getFieldValueByName('household[1][first_name]') ||
        getFieldValueByName('household[2][first_name]') ||
        '';

      var greet = firstName ? ('Good news, ' + firstName + '!') : 'Good news, Family!';

      var gNode = qs(root, '[data-confirm-greeting]');
      if(gNode) gNode.textContent = greet;

      qsa(root, '[data-confirm]').forEach(function(node){
        var key = node.getAttribute('data-confirm');
        if(key === 'submission_id') node.textContent = submissionId;
        if(key === 'order_date') node.textContent = orderDate;
        if(key === 'family_dues') node.textContent = duesText;
        if(key === 'family_id') node.textContent = familyId;
      });
    }

    function show(i){
      blurActive();

      idx = Math.max(0, Math.min(i, steps.length - 1));

      steps.forEach(function(stepEl, n){
        var active = (n === idx);
        stepEl.hidden = !active;
        stepEl.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      var denom = (steps.length - 1) || 1;
      var pct = Math.round((idx / denom) * 100);

      if(label) label.textContent = 'Step ' + (idx + 1) + ' of ' + steps.length;
      if(bar) bar.style.width = pct + '%';

      var activeStep = steps[idx];
      if(activeStep && activeStep.getAttribute('data-step') === '3'){
        renderReview();
      }

      blurActive();
      try{ window.scrollTo({ top: root.offsetTop - 20, behavior: 'smooth' }); }catch(e){}
    }

    root.addEventListener('click', function(e){
      var t = e.target;
      if(!t) return;

      if(t.matches && t.matches('[data-next-step]')){
        e.preventDefault();
        if(!validateCurrentStep()) return;
        show(idx + 1);
        return;
      }

      if(t.matches && t.matches('[data-prev-step]')){
        e.preventDefault();
        show(idx - 1);
        return;
      }

      if(t.matches && t.matches('[data-confirm-next]')){
        e.preventDefault();
        show(idx + 1);
        return;
      }

      if(t.matches && t.matches('[data-finish]')){
        e.preventDefault();
        try{ form && form.reset(); }catch(err){}
        show(0);
        return;
      }
    });

    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();

        if(!validateCurrentStep()) return;

        var step = steps[idx] ? steps[idx].getAttribute('data-step') : '';
        if(step === '3'){
          renderConfirmation();
          show(idx + 1);
          return;
        }

        show(idx + 1);
      });
    }

    show(idx);
  }

  function boot(){
    qsa(document, '.wizard-root').forEach(init);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
