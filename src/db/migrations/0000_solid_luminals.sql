CREATE TABLE "websiteOwner" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"domain" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "websiteOwner_email_unique" UNIQUE("email"),
	CONSTRAINT "websiteOwner_domain_unique" UNIQUE("domain")
);
