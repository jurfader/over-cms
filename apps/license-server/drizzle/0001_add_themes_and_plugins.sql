CREATE TABLE "lic_plugins" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" varchar(50) NOT NULL,
	"icon" varchar(100),
	"author" varchar(255),
	"min_cms_version" varchar(50),
	"required_plan" "lic_plan" DEFAULT 'solo',
	"price" integer DEFAULT 0,
	"currency" varchar(3) DEFAULT 'PLN',
	"download_url" text,
	"changelog" text,
	"active" boolean DEFAULT true NOT NULL,
	"downloads" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lic_themes" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" varchar(50) NOT NULL,
	"author" varchar(255),
	"required_plan" "lic_plan" DEFAULT 'solo',
	"filename" varchar(255) NOT NULL,
	"file_size" integer DEFAULT 0,
	"license_username" varchar(255),
	"license_api_key" text,
	"active" boolean DEFAULT true NOT NULL,
	"downloads" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
