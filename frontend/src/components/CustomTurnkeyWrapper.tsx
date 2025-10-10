import { useEffect } from 'react';
import { useTurnkey } from '@turnkey/react-wallet-kit';

interface CustomTurnkeyWrapperProps {
  children: React.ReactNode;
}

export function CustomTurnkeyWrapper({ children }: CustomTurnkeyWrapperProps) {
  useEffect(() => {
    // Add custom styling to Turnkey modal when it appears
    const addCustomStyling = () => {
      const modal = document.querySelector('[data-testid="turnkey-modal"]') || 
                   document.querySelector('.turnkey-modal') ||
                   document.querySelector('[role="dialog"]');
      
      if (modal) {
        // Add custom classes
        modal.classList.add('turnkey-modal');
        
        // Find and style the content
        const content = modal.querySelector('[data-testid="modal-content"]') ||
                       modal.querySelector('.modal-content') ||
                       modal.querySelector('[role="dialog"] > div');
        
        if (content) {
          content.classList.add('turnkey-modal-content');
          
          // Add VoxCard branding
          const header = content.querySelector('h1, h2, .modal-title');
          if (header) {
            const branding = document.createElement('div');
            branding.className = 'voxcard-branding';
            branding.innerHTML = `
              <div class="voxcard-logo">V</div>
              <div class="voxcard-tagline">Save Safe, Win Sure.</div>
            `;
            content.insertBefore(branding, header);
          }
          
          // Style buttons
          const buttons = content.querySelectorAll('button');
          buttons.forEach((button, index) => {
            if (index === 0) {
              // Primary button (email login)
              button.style.background = 'linear-gradient(135deg, #f48024, #ff9a56)';
              button.style.boxShadow = '0 4px 14px 0 rgba(244, 128, 36, 0.3)';
            } else {
              // Secondary buttons
              button.setAttribute('data-variant', 'secondary');
            }
          });
          
          // Style input fields
          const inputs = content.querySelectorAll('input[type="email"], input[type="text"]');
          inputs.forEach(input => {
            input.style.background = 'rgba(255, 255, 255, 0.9)';
            input.style.border = '2px solid #e5e7eb';
            input.style.borderRadius = '12px';
            input.style.padding = '1rem 1.25rem';
            input.style.transition = 'all 0.3s ease';
            input.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          });
          
          // Add separators styling
          const separators = content.querySelectorAll('.separator, [data-separator]');
          separators.forEach(separator => {
            separator.className = 'separator';
          });
          
          // Style legal text
          const legalText = content.querySelector('[data-legal], .legal-text');
          if (legalText) {
            legalText.className = 'legal-text';
          }
          
          // Add security badge
          const securityBadge = content.querySelector('[data-security], .security-badge');
          if (securityBadge) {
            securityBadge.className = 'security-badge';
          }
          
          // Find and style close button without breaking functionality
          const closeButtonSelectors = [
            '[data-testid="close-button"]',
            'button[aria-label="Close"]',
            'button[aria-label="close"]',
            '.close-button',
            '[data-close]',
            'button[type="button"]:last-child', // Often the last button is close
            'button:has(svg)', // Button with SVG icon (often close)
            'button[class*="close"]',
            'button[class*="Close"]'
          ];
          
          let closeButton = null;
          for (const selector of closeButtonSelectors) {
            closeButton = modal.querySelector(selector);
            if (closeButton) {
              console.log('Found close button with selector:', selector);
              break;
            }
          }
          
          if (closeButton) {
            console.log('Styling close button:', closeButton);
            
            // Add our styling classes without removing existing ones
            closeButton.classList.add('custom-close-button');
            
            // Don't interfere with existing click handlers - just add visual styling
            // The original Turnkey functionality should handle the closing
            
            // Add a visual indicator that the button is clickable
            closeButton.style.cursor = 'pointer';
            closeButton.style.zIndex = '1000';
            
            // Log when the button is clicked for debugging
            const originalClickHandler = closeButton.onclick;
            closeButton.addEventListener('click', (e) => {
              console.log('✅ Close button clicked successfully');
            }, { once: false, passive: true });
          } else {
            console.log('❌ Close button not found in modal');
          }
        }
      }
    };

    // Check for modal periodically
    const interval = setInterval(addCustomStyling, 100);
    
    // Also check when DOM changes
    const observer = new MutationObserver(addCustomStyling);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
