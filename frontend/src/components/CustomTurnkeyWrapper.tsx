import { useEffect, useRef } from 'react';

interface CustomTurnkeyWrapperProps {
  children: React.ReactNode;
}

export function CustomTurnkeyWrapper({ children }: CustomTurnkeyWrapperProps) {
  const styledModals = useRef(new Set<Element>());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Add custom styling to Turnkey modal when it appears
    const addCustomStyling = () => {
      const modal = document.querySelector('[data-testid="turnkey-modal"]') || 
                   document.querySelector('.turnkey-modal') ||
                   document.querySelector('[role="dialog"]');
      
      // Only style if modal exists and hasn't been styled yet
      if (modal && !styledModals.current.has(modal)) {
        styledModals.current.add(modal);
        
        // Add custom classes
        modal.classList.add('turnkey-modal');
        
        // Find and style the content
        const content = modal.querySelector('[data-testid="modal-content"]') ||
                       modal.querySelector('.modal-content') ||
                       modal.querySelector('[role="dialog"] > div');
        
        if (content) {
          content.classList.add('turnkey-modal-content');
          
          // Add VoxCard branding (only if not already added)
          const existingBranding = content.querySelector('.voxcard-branding');
          if (!existingBranding) {
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
          }
          
          // Style buttons (only if not already styled)
          const buttons = content.querySelectorAll('button:not([data-voxcard-styled])');
          buttons.forEach((button, index) => {
            button.setAttribute('data-voxcard-styled', 'true');
            if (index === 0) {
              // Primary button (email login)
              button.style.background = 'linear-gradient(135deg, #f48024, #ff9a56)';
              button.style.boxShadow = '0 4px 14px 0 rgba(244, 128, 36, 0.3)';
            } else {
              // Secondary buttons
              button.setAttribute('data-variant', 'secondary');
            }
          });
          
          // Style input fields (only if not already styled)
          const inputs = content.querySelectorAll('input[type="email"]:not([data-voxcard-styled]), input[type="text"]:not([data-voxcard-styled])');
          inputs.forEach(input => {
            input.setAttribute('data-voxcard-styled', 'true');
            input.style.background = 'rgba(255, 255, 255, 0.9)';
            input.style.border = '2px solid #e5e7eb';
            input.style.borderRadius = '12px';
            input.style.padding = '1rem 1.25rem';
            input.style.transition = 'all 0.3s ease';
            input.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          });
          
          // Add separators styling
          const separators = content.querySelectorAll('.separator:not([data-voxcard-styled]), [data-separator]:not([data-voxcard-styled])');
          separators.forEach(separator => {
            separator.setAttribute('data-voxcard-styled', 'true');
            separator.className = 'separator';
          });
          
          // Style legal text
          const legalText = content.querySelector('[data-legal]:not([data-voxcard-styled]), .legal-text:not([data-voxcard-styled])');
          if (legalText) {
            legalText.setAttribute('data-voxcard-styled', 'true');
            legalText.className = 'legal-text';
          }
          
          // Add security badge
          const securityBadge = content.querySelector('[data-security]:not([data-voxcard-styled]), .security-badge:not([data-voxcard-styled])');
          if (securityBadge) {
            securityBadge.setAttribute('data-voxcard-styled', 'true');
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
            if (closeButton && !closeButton.classList.contains('custom-close-button')) {
              break;
            }
          }
          
          if (closeButton) {
            // Add our styling classes without removing existing ones
            closeButton.classList.add('custom-close-button');
            
            // Add a visual indicator that the button is clickable
            closeButton.style.cursor = 'pointer';
            closeButton.style.zIndex = '1000';
          }
        }
      }
    };

    // Use a more conservative approach - check less frequently
    intervalRef.current = setInterval(addCustomStyling, 1000); // Reduced from 100ms to 1000ms
    
    // Also check when DOM changes, but with more specific targeting
    observerRef.current = new MutationObserver((mutations) => {
      // Only check if a dialog/modal was added
      const hasModalChange = mutations.some(mutation => 
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).matches?.('[role="dialog"], .turnkey-modal, [data-testid="turnkey-modal"]')
        )
      );
      
      if (hasModalChange) {
        addCustomStyling();
      }
    });
    
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      styledModals.current.clear();
    };
  }, []);

  return <>{children}</>;
}
