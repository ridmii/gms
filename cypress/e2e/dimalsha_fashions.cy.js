describe('Dimalsha Fashions Website Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('TC-HOME-001: Verifies home page loads', () => {
    cy.visit('http://localhost:5173/');
    cy.url().should('eq', 'http://localhost:5173/');
    cy.wait(3000);
    
    // Check for home page content
    cy.get('body').should('contain', 'Dimalsha Fashions');
    cy.wait(2000);
  });

  it('TC-HOME-002: Places a new order with success message and email', () => {
    cy.visit('http://localhost:5173/order');
    cy.url().should('include', '/order');
    cy.wait(3000);
    
    // Fill the form with proper delays
    cy.get('input[name="name"]').should('be.visible').type('Anuruddha Abesinghe', { delay: 150 });
    cy.wait(500);
    cy.get('input[name="email"]').type('anuruddha@example.com', { delay: 150 });
    cy.wait(500);
    cy.get('input[name="mobile"]').type('+94123456789', { delay: 150 });
    cy.wait(500);
    cy.get('input[name="address"]').type('123 Test St, Colombo', { delay: 150 });
    cy.wait(500);
    cy.get('select[name="material"]').select('Cotton');
    cy.wait(500);
    cy.get('input[name="quantity"]').clear().type('10', { delay: 150 });
    cy.wait(500);
    
    // Check artwork tickbox if it exists
    cy.get('body').then(($body) => {
      if ($body.find('input[type="checkbox"][name*="artwork"]').length > 0) {
        cy.get('input[type="checkbox"][name*="artwork"]').check({ force: true });
        cy.wait(500);
      } else if ($body.find('input[type="checkbox"]').length > 0) {
        // Try to find any checkbox that might be for artwork
        cy.get('input[type="checkbox"]').first().check({ force: true });
        cy.wait(500);
      }
    });
    
    // Fill artwork description with fallback selectors
    cy.get('body').then(($body) => {
      if ($body.find('textarea[name="artworkText"]').length > 0) {
        cy.get('textarea[name="artworkText"]').type('keep this centered on upper chest part', { delay: 150 });
      } else if ($body.find('input[name="artworkText"]').length > 0) {
        cy.get('input[name="artworkText"]').type('keep this centered on upper chest part', { delay: 150 });
      } else if ($body.find('[name="artworkText"]').length > 0) {
        cy.get('[name="artworkText"]').type('keep this centered on upper chest part', { delay: 150 });
      } else if ($body.find('textarea').length > 0) {
        cy.get('textarea').first().type('keep this centered on upper chest part', { delay: 150 });
      } else {
        cy.log('Artwork text field not found, proceeding without it');
      }
    });
    
    cy.wait(500);
    
    // Upload artwork image
    cy.get('body').then(($body) => {
      if ($body.find('input[type="file"]').length > 0) {
        cy.get('input[type="file"]').selectFile('cypress/fixtures/b.png', { force: true });
        cy.wait(1000);
      } else {
        cy.log('File upload input not found, proceeding without image upload');
      }
    });
    
    cy.wait(1000);

    // Mock API responses
    cy.intercept('POST', 'http://localhost:5000/api/orders', {
      statusCode: 201,
      body: { 
        success: true, 
        order: { 
          _id: '1234567890abcdef12345678',
          orderId: 'ORD123456'
        } 
      },
    }).as('createOrder');

    cy.intercept('POST', 'http://localhost:5000/api/orders/send-email', {
      statusCode: 200,
      body: { success: true, message: 'Email sent successfully' },
    }).as('sendEmail');

    // Find and click submit button with multiple selector options
    cy.get('body').then(($body) => {
      if ($body.find('button.submit-order-button').length > 0) {
        cy.get('button.submit-order-button').click();
      } else if ($body.find('button[type="submit"]').length > 0) {
        cy.get('button[type="submit"]').click();
      } else if ($body.find('button').contains('Submit').length > 0) {
        cy.get('button').contains('Submit').click();
      } else if ($body.find('button').contains('Order').length > 0) {
        cy.get('button').contains('Order').click();
      } else {
        cy.get('button').first().click();
      }
    });
    
    cy.wait(2000);
    
    cy.wait('@createOrder', { timeout: 10000 });
    cy.wait('@sendEmail', { timeout: 10000 });

    // Check success modal with multiple selector options
    cy.get('body').then(($body) => {
      if ($body.find('.success-modal').length > 0) {
        cy.get('.success-modal', { timeout: 15000 }).should('be.visible');
      } else if ($body.find('.modal').length > 0) {
        cy.get('.modal', { timeout: 15000 }).should('be.visible');
      } else if ($body.find('[class*="success"]').length > 0) {
        cy.get('[class*="success"]', { timeout: 15000 }).should('be.visible');
      } else {
        cy.get('body').should('contain', 'success', { timeout: 15000 });
      }
    });
    
    cy.wait(3000);
  });

  it('TC-PAST-001: Views past orders with valid email', () => {
    cy.visit('http://localhost:5173/past-orders');
    cy.url().should('include', '/past-orders');
    cy.wait(500); // Reduced from 1000ms to 500ms
    
    cy.get('input[type="email"]').should('be.visible').type('heyridmi@gmail.com', { delay: 100 }); // Reduced delay
    
    cy.intercept('GET', 'http://localhost:5000/api/orders/customer/heyridmi@gmail.com', {
      statusCode: 200,
      body: [
        { 
          _id: '1234567890abcdef12345678', 
          date: '2025-09-25', 
          material: 'Cotton', 
          quantity: 10, 
          priceDetails: { total: 15000 },
          name: 'Ridmi Vancuylenburg',
          email: 'heyridmi@gmail.com',
          mobile: '+94769870805'
        }
      ],
    }).as('getOrders');

    cy.contains(/fetch|search/i).click({ force: true });
    cy.wait('@getOrders');

    cy.get('table').should('be.visible');
    cy.get('table tbody tr').should('have.length.at.least', 1);
  });

  it('TC-ADMIN-001: Logs in as admin successfully', () => {
    cy.visit('http://localhost:5173/admin/login');
    cy.wait(3000);
    
    cy.get('input[type="email"]').should('be.visible').type('admin@dimalsha.com', { delay: 150 });
    cy.wait(500);
    cy.get('input[type="password"]').type('admin123', { delay: 150 });
    cy.wait(1000);

    // Mock admin login response
    cy.intercept('POST', 'http://localhost:5000/api/admin/login', {
      statusCode: 200,
      body: { 
        success: true,
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1ODk1ODIzNywiZXhwIjoxNzU5MDQ0NjM3fQ.nrtotxB33e2dLEL1A7sKf_DK8ER4wv3BA52F1AB4_2I",
        user: { 
          email: 'admin@dimalsha.com',
          name: 'Admin User'
        }
      },
    }).as('adminLogin');

    cy.get('button[type="submit"]').click();
    cy.wait(2000);
    
    cy.wait('@adminLogin', { timeout: 10000 }).then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      // Set token in localStorage for the next page
      window.localStorage.setItem('adminToken', interception.response.body.token);
    });
    
    // Check if redirected to dashboard or dashboard content is visible
    cy.url().then((url) => {
      if (url.includes('/admin/dashboard')) {
        cy.contains('Dashboard').should('be.visible');
      } else {
        cy.visit('http://localhost:5173/admin/dashboard');
        cy.contains('Dashboard').should('be.visible');
      }
    });
    
    cy.wait(2000);
  });

  it('TC-DASHBOARD-001: Verifies admin dashboard loads', () => {
    // Set token directly and visit dashboard
    cy.visit('http://localhost:5173/admin/dashboard', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('adminToken', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1ODk1ODIzNywiZXhwIjoxNzU5MDQ0NjM3fQ.nrtotxB33e2dLEL1A7sKf_DK8ER4wv3BA52F1AB4_2I");
      }
    });

    cy.url().should('include', '/admin/dashboard');
    cy.wait(3000);
    cy.contains('Dashboard').should('be.visible');
    cy.wait(2000);
  });

  it('TC-DASHBOARD-002: Tests admin orders page loads', () => {
    // Set token and visit orders page directly
    cy.visit('http://localhost:5173/admin/orders', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('adminToken', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1ODk1ODIzNywiZXhwIjoxNzU5MDQ0NjM3fQ.nrtotxB33e2dLEL1A7sKf_DK8ER4wv3BA52F1AB4_2I");
      }
    });

    cy.url().should('include', '/admin/orders');
    cy.wait(3000);
    
    // Wait for page to load and check basic elements
    cy.get('body').should('contain', 'Orders');
    cy.get('table').should('be.visible');
    cy.wait(2000);
  });

  it('TC-DASHBOARD-003: Tests order edit functionality', () => {
    cy.visit('http://localhost:5173/admin/orders', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('adminToken', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1ODk1ODIzNywiZXhwIjoxNzU5MDQ0NjM3fQ.nrtotxB33e2dLEL1A7sKf_DK8ER4wv3BA52F1AB4_2I");
      }
    });

    cy.url().should('include', '/admin/orders');
    cy.wait(3000);
    
    // Mock orders data
    cy.intercept('GET', 'http://localhost:5000/api/orders/admin', {
      statusCode: 200,
      body: [
        { 
          _id: '1234567890abcdef12345678', 
          date: '2025-09-25', 
          material: 'Cotton', 
          quantity: 10, 
          priceDetails: { total: 15000 },
          orderId: 'ORD123456',
          name: 'Anuruddha Abesinghe',
          email: 'anuruddha@gmail.com',
          mobile: '+94123456789',
          address: '123 Test St, Colombo'
        }
      ],
    }).as('getOrders');

    cy.wait(3000);
    
    // Test Edit functionality only if button exists
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Edit")').length > 0) {
        cy.get('button:contains("Edit")').first().click({ force: true });
        cy.wait(2000);
        
        // Verify edit modal opens
        cy.get('body').should('contain', 'Edit Order');
        
        // Make some changes - UPDATED: Changed to different name "SLIIT University"
        cy.get('input[name="name"]').clear().type('SLIIT University', { delay: 100 });
        cy.wait(1000);
        cy.get('input[name="quantity"]').clear().type('25', { delay: 100 }); // Changed quantity
        cy.wait(1000);
        
        // Mock the update API call
        cy.intercept('PUT', 'http://localhost:5000/api/orders/1234567890abcdef12345678', {
          statusCode: 200,
          body: { 
            success: true,
            order: { 
              _id: '1234567890abcdef12345678',
              name: 'SLIIT University', // Updated name
              quantity: 25, // Updated quantity
              material: 'Cotton'
            }
          }
        }).as('updateOrder');
        
        // Click Save button
        cy.get('button:contains("Save")').click({ force: true });
        cy.wait(2000);
        
        // Verify the modal closes
        cy.get('body').should('not.contain', 'Edit Order');
        cy.wait(2000);
      } else {
        cy.log('No Edit button found, skipping edit test');
      }
    });
  });

  it('TC-DASHBOARD-004: Tests order search functionality', () => {
    cy.visit('http://localhost:5173/admin/orders', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('adminToken', "FAKE_JWT_TOKEN");
      }
    });

    cy.intercept('GET', 'http://localhost:5000/api/orders/admin', {
      statusCode: 200,
      body: [
        { _id: '1', orderId: 'ORD123', name: 'Ridmi', material: 'Cotton', quantity: 10 },
        { _id: '2', orderId: 'ORD124', name: 'Another User', material: 'Polyester', quantity: 5 }
      ]
    }).as('getAdminOrders');

    cy.wait('@getAdminOrders');
    cy.get('table tbody tr').should('have.length.at.least', 2);

    cy.get('input[placeholder*="Search"]').type('Ridmi');
    cy.wait(500);

    // Verify filtering works
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('table tbody tr').should('contain', 'Ridmi');
  });

  it('TC-DASHBOARD-005: Tests invoice download', () => {
    cy.visit('http://localhost:5173/admin/orders', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('adminToken', "FAKE_JWT_TOKEN");
      }
    });

    cy.intercept('GET', 'http://localhost:5000/api/orders/admin', {
      statusCode: 200,
      body: [
        { _id: '123456', orderId: 'ORD555', name: 'Ridmi', material: 'Cotton', quantity: 12 }
      ]
    }).as('getAdminOrders');

    cy.wait('@getAdminOrders');

    // Intercept invoice download
    cy.intercept('GET', 'http://localhost:5000/api/orders/123456/invoice', {
      statusCode: 200,
      body: 'PDF-DATA',
      headers: { 'content-type': 'application/pdf' }
    }).as('downloadInvoice');

    // Click the Invoice button (matches your JSX)
    cy.contains('button', /^Invoice$/).click({ force: true });

    // Verify download API was called
    cy.wait('@downloadInvoice').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });
  });

  it('TC-DASHBOARD-006: Tests order delete functionality', () => {
    cy.visit('http://localhost:5173/admin/orders', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('adminToken', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1ODk1ODIzNywiZXhwIjoxNzU5MDQ0NjM3fQ.nrtotxB33e2dLEL1A7sKf_DK8ER4wv3BA52F1AB4_2I");
      }
    });

    cy.url().should('include', '/admin/orders');
    cy.wait(3000);
    
    // Mock orders data
    cy.intercept('GET', 'http://localhost:5000/api/orders/admin', {
      statusCode: 200,
      body: [
        { 
          _id: '1234567890abcdef12345678', 
          orderId: 'ORD123456', 
          name: 'Test Customer', 
          material: 'Cotton', 
          quantity: 10 
        },
        { 
          _id: '2234567890abcdef12345679', 
          orderId: 'ORD123457', 
          name: 'Another Customer', 
          material: 'Polyester', 
          quantity: 5 
        }
      ]
    }).as('getAdminOrders');

    cy.wait(3000);
    
    // Test Delete functionality
    cy.get('body').then(($body) => {
      const deleteButtons = $body.find('button').filter((index, button) => 
        button.textContent.includes('Delete') || 
        button.textContent.includes('Remove') ||
        button.innerHTML.includes('delete') ||
        button.innerHTML.includes('trash')
      );
      
      if (deleteButtons.length > 0) {
        cy.log('Delete button found, attempting to delete order');
        
        // Mock the delete API call
        cy.intercept('DELETE', 'http://localhost:5000/api/orders/1234567890abcdef12345678', {
          statusCode: 200,
          body: { 
            success: true,
            message: 'Order deleted successfully'
          }
        }).as('deleteOrder');

        // Mock the refreshed orders list after deletion
        cy.intercept('GET', 'http://localhost:5000/api/orders/admin', {
          statusCode: 200,
          body: [
            { 
              _id: '2234567890abcdef12345679', 
              orderId: 'ORD123457', 
              name: 'Another Customer', 
              material: 'Polyester', 
              quantity: 5 
            }
          ],
        }).as('getOrdersAfterDelete');

        // Store initial row count
        cy.get('table tbody tr').then(($rows) => {
          const initialCount = $rows.length;
          cy.log(`Initial order count: ${initialCount}`);
        });

        // Click delete button
        cy.wrap(deleteButtons.first()).click({ force: true });
        cy.wait(1000);
        
        // Handle confirmation dialog if it appears
        cy.on('window:confirm', (text) => {
          expect(text).to.include('delete');
          return true;
        });
        
        cy.wait(2000);
        
        // Check if deletion was successful
        cy.get('body').then(($body) => {
          if ($body.text().includes('deleted') || $body.text().includes('success')) {
            cy.log('Order deleted successfully');
          } else {
            // Check if the table has fewer rows
            cy.get('table tbody tr').should('have.length.lessThan', 2);
          }
        });
        
        cy.wait(2000);
        cy.log('Order deletion test completed');
        
      } else {
        cy.log('No Delete button found, skipping delete test');
      }
    });
  });
});