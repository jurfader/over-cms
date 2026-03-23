CREATE TYPE "public"."lic_plan" AS ENUM('trial', 'solo', 'agency');--> statement-breakpoint
CREATE TYPE "public"."lic_status" AS ENUM('active', 'suspended', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "lic_activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_id" uuid NOT NULL,
	"domain" varchar(255) NOT NULL,
	"installation_id" varchar(64) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lic_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_id" uuid,
	"event" varchar(100) NOT NULL,
	"domain" varchar(255),
	"meta" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lic_licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"plan" "lic_plan" DEFAULT 'trial' NOT NULL,
	"status" "lic_status" DEFAULT 'active' NOT NULL,
	"buyer_email" varchar(255) NOT NULL,
	"buyer_name" varchar(255),
	"max_installations" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp,
	"stripe_customer_id" varchar(100),
	"stripe_subscription_id" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lic_licenses_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "lic_activations" ADD CONSTRAINT "lic_activations_license_id_lic_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."lic_licenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lic_audit" ADD CONSTRAINT "lic_audit_license_id_lic_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."lic_licenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lic_act_domain_unique" ON "lic_activations" USING btree ("license_id","domain");