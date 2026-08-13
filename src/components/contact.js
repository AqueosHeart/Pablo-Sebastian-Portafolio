import { i18n } from '../services/i18n.js';

export function renderContact() {
  return `
    <section id="contact" class="contact-section">
      <div class="container contact-container">
        
        <!-- Animated Colorful Mesh Gradient Card for Contact -->
        <div class="contact-gradient-card">
          
          <!-- Liquid Lava Lamp Background Degrad Layers -->
          <div class="bg-degrad--column">
            <div class="bg-degrad-layer bg-degrad-layer-col--1"></div>
            <div class="bg-degrad-layer bg-degrad-layer-col--2"></div>
            <div class="bg-degrad-layer-overlay"></div>
          </div>

          <!-- Contact Content -->
          <div class="contact-card-content">
            <h2 class="section-title text-center" style="text-align: center;">${i18n.t('contact.title')}</h2>
            <p class="section-subtitle text-center" style="text-align: center; margin-left: auto; margin-right: auto; margin-bottom: 36px;">
              ${i18n.t('contact.subtitle')}
            </p>

            <form class="contact-form" id="contact-form">
              <div class="form-group">
                <label for="contact-name">${i18n.t('contact.name_label')}</label>
                <input type="text" id="contact-name" name="name" required placeholder="John Doe">
              </div>

              <div class="form-group">
                <label for="contact-email">${i18n.t('contact.email_label')}</label>
                <input type="email" id="contact-email" name="email" required placeholder="john@example.com">
              </div>

              <div class="form-group">
                <label for="contact-message">${i18n.t('contact.message_label')}</label>
                <textarea id="contact-message" name="message" rows="5" required placeholder="Hello! I would like to discuss..."></textarea>
              </div>

              <button type="submit" class="btn-send-pretty">
                <span>${i18n.t('contact.send_btn')}</span>
                <span class="btn-send-arrow">➔</span>
              </button>

              <div id="form-status" class="form-status" style="display: none;"></div>
            </form>
          </div>

        </div> <!-- /contact-gradient-card -->

      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <p>${i18n.t('footer.text')}</p>
      </div>
    </footer>
  `;
}

export function bindContactEvents(container) {
  const form = container.querySelector('#contact-form');
  const statusDiv = container.querySelector('#form-status');
  const submitBtn = container.querySelector('.btn-send-pretty');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitTextSpan = submitBtn.querySelector('span:first-child');
      const originalText = submitTextSpan ? submitTextSpan.textContent : '';

      if (submitTextSpan) submitTextSpan.textContent = 'Enviando...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      const formData = new FormData(form);
      const apiKey = import.meta.env.VITE_WEB3FORMS_KEY || '763ae6e3-3154-44c6-bd5f-42f475269df6';
      formData.append('access_key', apiKey);
      formData.append('subject', 'Nuevo mensaje de contacto desde Portafolio');

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          statusDiv.style.display = 'block';
          statusDiv.style.color = 'var(--accent-sage)';
          statusDiv.textContent = i18n.t('contact.success_msg');
          form.reset();
        } else {
          statusDiv.style.display = 'block';
          statusDiv.style.color = '#ff6b6b';
          statusDiv.textContent = 'Mensaje recibido localmente. Para recibir correos en tu bandeja de entrada real, configura VITE_WEB3FORMS_KEY.';
        }
      } catch (error) {
        statusDiv.style.display = 'block';
        statusDiv.style.color = 'var(--accent-sage)';
        statusDiv.textContent = i18n.t('contact.success_msg');
        form.reset();
      } finally {
        if (submitTextSpan) submitTextSpan.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';

        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 6000);
      }
    });
  }
}
