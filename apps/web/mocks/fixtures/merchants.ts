// Mock merchant data for different tenant scenarios
export const mockMerchants = {
  // Single-tenant merchant
  singleTenant: {
    id: "merchant-123e4567-e89b-12d3-a456-426614174000",
    organizationId: "org-123e4567-e89b-12d3-a456-426614174000",
    name: "AcmeHealthcare Corp",
    type: "single_tenant" as const,
    status: "active" as const,
    settings: {
      currency: "USD",
      timezone: "America/New_York",
      webhookUrl: "https://api.acmehealthcare.com/webhooks/payments",
    },
  },

  // Multi-tenant platform merchant
  platformMerchant: {
    id: "merchant-456e7890-e89b-12d3-a456-426614174001", 
    organizationId: "org-456e7890-e89b-12d3-a456-426614174001",
    name: "TechFlow Solutions",
    type: "multi_tenant" as const,
    status: "active" as const,
    settings: {
      currency: "EUR",
      timezone: "Europe/London",
      webhookUrl: "https://platform.techflow.com/webhooks",
    },
  },
} as const;

// Helper to get current mock merchant (can be switched for testing)
export const getCurrentMerchant = () => mockMerchants.singleTenant;