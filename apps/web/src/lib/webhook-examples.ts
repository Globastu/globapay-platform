// Webhook payload examples for the injector tool
// These mirror the examples from the API providers

export const WEBHOOK_EXAMPLES = {
  psp: {
    paymentCompleted: {
      event_id: "evt_1234567890",
      event_type: "payment.completed",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_acmehealthcare",
      transaction_id: "txn_abc123def456",
      amount: 2500,
      currency: "USD",
      status: "completed",
      payment_method: {
        type: "card",
        last4: "4242",
        brand: "visa",
        exp_month: 12,
        exp_year: 2025
      },
      metadata: {
        checkout_session_id: "cs_xyz789abc123",
        payment_link_id: "pl_health_consultation"
      },
      processing_fee: 75, // $0.75 (3% of $25)
      net_amount: 2425,
      created_at: "2024-01-15T10:30:00Z",
      completed_at: "2024-01-15T10:30:15Z"
    },
    paymentFailed: {
      event_id: "evt_0987654321",
      event_type: "payment.failed",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_acmehealthcare",
      transaction_id: "txn_def456ghi789",
      amount: 1500,
      currency: "USD",
      status: "failed",
      failure_code: "card_declined",
      failure_message: "Your card was declined. Please try a different payment method.",
      payment_method: {
        type: "card",
        last4: "0002",
        brand: "visa"
      },
      metadata: {
        checkout_session_id: "cs_abc123xyz789",
        payment_link_id: "pl_therapy_session"
      },
      attempt_count: 1,
      created_at: "2024-01-15T10:35:00Z",
      failed_at: "2024-01-15T10:35:03Z"
    },
    paymentRefunded: {
      event_id: "evt_refund_123456",
      event_type: "payment.refunded",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_acmehealthcare",
      transaction_id: "txn_abc123def456",
      refund_id: "re_789012345678",
      amount: 2500,
      refund_amount: 2500,
      currency: "USD",
      status: "refunded",
      reason: "cancelled_appointment",
      refund_status: "succeeded",
      metadata: {
        original_payment_id: "txn_abc123def456",
        refund_reason: "Patient cancelled appointment"
      },
      created_at: "2024-01-15T14:20:00Z",
      refunded_at: "2024-01-15T14:20:05Z"
    }
  },
  fraud: {
    highRiskTransaction: {
      decision_id: "decision_high_risk_123",
      event_type: "fraud.high_risk",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_acmehealthcare",
      transaction_id: "txn_suspicious_456",
      risk_score: 85,
      decision: "decline",
      recommendation: "decline",
      factors: [
        {
          type: "velocity",
          description: "High transaction velocity from IP address",
          weight: 35,
          details: {
            ip_address: "192.168.1.100",
            transaction_count: 5,
            time_window: "1 hour"
          }
        },
        {
          type: "geolocation",
          description: "Transaction from high-risk country",
          weight: 25,
          details: {
            country: "Unknown",
            risk_level: "high"
          }
        },
        {
          type: "device_fingerprint",
          description: "Suspicious device characteristics",
          weight: 25,
          details: {
            device_id: "unknown",
            browser: "automated"
          }
        }
      ],
      transaction_details: {
        amount: 5000,
        currency: "USD",
        customer_email: "suspicious@example.com",
        ip_address: "192.168.1.100"
      },
      created_at: "2024-01-15T10:30:00Z"
    },
    lowRiskTransaction: {
      decision_id: "decision_low_risk_456",
      event_type: "fraud.low_risk",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_acmehealthcare",
      transaction_id: "txn_trusted_789",
      risk_score: 15,
      decision: "approve",
      recommendation: "approve",
      factors: [
        {
          type: "customer_history",
          description: "Returning customer with excellent payment history",
          weight: -20,
          details: {
            customer_id: "cust_regular_patient",
            previous_transactions: 12,
            failed_payments: 0
          }
        },
        {
          type: "geolocation",
          description: "Transaction from customer's usual location",
          weight: -10,
          details: {
            country: "US",
            city: "San Francisco",
            matches_billing: true
          }
        }
      ],
      transaction_details: {
        amount: 2500,
        currency: "USD",
        customer_email: "patient@example.com",
        ip_address: "203.0.113.1"
      },
      created_at: "2024-01-15T10:35:00Z"
    },
    manualReview: {
      decision_id: "decision_review_789",
      event_type: "fraud.manual_review",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_acmehealthcare",
      transaction_id: "txn_review_012",
      risk_score: 55,
      decision: "review",
      recommendation: "manual_review",
      factors: [
        {
          type: "amount_anomaly",
          description: "Transaction amount significantly higher than usual",
          weight: 30,
          details: {
            amount: 15000,
            average_amount: 2500,
            deviation: "6x normal"
          }
        },
        {
          type: "new_payment_method",
          description: "First time using this payment method",
          weight: 25,
          details: {
            payment_method: "new_card",
            customer_history: "established"
          }
        }
      ],
      review_queue: "high_value_transactions",
      estimated_review_time: "2 hours",
      transaction_details: {
        amount: 15000,
        currency: "USD",
        customer_email: "patient@example.com",
        description: "Comprehensive health screening package"
      },
      created_at: "2024-01-15T11:00:00Z"
    }
  },
  kyb: {
    verificationCompleted: {
      verification_id: "kyb_verification_123456",
      event_type: "kyb.verification_completed",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_newclinic",
      application_id: "app_clinic_onboarding",
      status: "approved",
      verification_level: "full",
      business_details: {
        legal_name: "New Medical Clinic LLC",
        business_type: "healthcare_provider",
        tax_id: "12-3456789",
        registration_number: "LLC2024001234"
      },
      documents_verified: [
        {
          type: "business_registration",
          status: "verified",
          confidence: 0.95,
          verification_method: "government_database"
        },
        {
          type: "tax_identification",
          status: "verified",
          confidence: 0.92,
          verification_method: "irs_verification"
        },
        {
          type: "professional_license",
          status: "verified",
          confidence: 0.98,
          verification_method: "medical_board_check",
          details: {
            license_number: "MD123456789",
            expiry_date: "2025-12-31"
          }
        }
      ],
      risk_assessment: {
        level: "low",
        score: 0.15,
        factors: [
          {
            type: "business_age",
            impact: "positive",
            description: "Established business with 5+ years history"
          },
          {
            type: "professional_credentials",
            impact: "positive",
            description: "Valid medical licenses verified"
          }
        ]
      },
      compliance_checks: {
        sanctions_screening: "passed",
        pep_screening: "passed",
        adverse_media: "clear"
      },
      approved_services: [
        "payment_processing",
        "recurring_billing",
        "international_payments"
      ],
      processing_limits: {
        daily_limit: 50000,
        monthly_limit: 1000000,
        currency: "USD"
      },
      created_at: "2024-01-15T10:30:00Z",
      approved_at: "2024-01-15T10:45:00Z"
    },
    verificationFailed: {
      verification_id: "kyb_verification_789012",
      event_type: "kyb.verification_failed",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_failedclinic",
      application_id: "app_failed_onboarding",
      status: "rejected",
      business_details: {
        legal_name: "Unverified Clinic Inc",
        business_type: "healthcare_provider",
        tax_id: "98-7654321"
      },
      rejection_reasons: [
        {
          code: "invalid_business_registration",
          description: "Business registration document could not be verified with state records",
          document_type: "business_registration",
          severity: "high",
          resolution_steps: [
            "Provide updated business registration certificate",
            "Ensure document is from official government source",
            "Contact state business registration office if needed"
          ]
        },
        {
          code: "expired_professional_license",
          description: "Medical license has expired",
          document_type: "professional_license",
          severity: "high",
          details: {
            license_number: "MD987654321",
            expiry_date: "2023-12-31",
            current_status: "expired"
          },
          resolution_steps: [
            "Renew medical license with appropriate medical board",
            "Provide current, valid license documentation"
          ]
        }
      ],
      retry_allowed: true,
      retry_instructions: "Please address the rejection reasons and resubmit your application with updated documentation.",
      support_contact: "kyb-support@globapay.com",
      created_at: "2024-01-15T10:35:00Z",
      rejected_at: "2024-01-15T10:50:00Z"
    },
    additionalDocumentsRequired: {
      verification_id: "kyb_verification_345678",
      event_type: "kyb.documents_required",
      organization_id: "org_healthcare_demo",
      merchant_id: "merchant_pendingclinic",
      application_id: "app_pending_docs",
      status: "pending",
      business_details: {
        legal_name: "Pending Verification Clinic",
        business_type: "healthcare_provider"
      },
      current_verification_level: "partial",
      required_documents: [
        {
          type: "bank_statement",
          description: "Recent bank statement showing business account (last 3 months)",
          required: true,
          format_requirements: [
            "PDF format preferred",
            "Must show business name matching application",
            "Account statements must be consecutive months"
          ]
        },
        {
          type: "utility_bill",
          description: "Business utility bill for address verification",
          required: true,
          format_requirements: [
            "Must be dated within last 90 days",
            "Business name and address must match application"
          ]
        },
        {
          type: "professional_liability_insurance",
          description: "Current professional liability insurance certificate",
          required: false,
          priority: "recommended",
          benefits: [
            "Higher processing limits",
            "Reduced reserve requirements",
            "Priority customer support"
          ]
        }
      ],
      submission_instructions: {
        upload_portal: "https://kyb.globapay.com/upload/345678",
        deadline: "2024-01-30T23:59:59Z",
        supported_formats: ["PDF", "JPG", "PNG"],
        max_file_size: "10MB per document"
      },
      contact_info: {
        support_email: "kyb-support@globapay.com",
        support_phone: "+1-800-GLOBAPAY",
        business_hours: "Monday-Friday 9AM-6PM EST"
      },
      created_at: "2024-01-15T10:40:00Z"
    }
  }
} as const;