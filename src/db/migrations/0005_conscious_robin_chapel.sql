CREATE TABLE "review" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"estimate_value" varchar NOT NULL,
	"landscaping" numeric NOT NULL,
	"location" numeric NOT NULL,
	"view" numeric NOT NULL,
	"curb_appeal" numeric NOT NULL,
	"address" varchar NOT NULL,
	"comments" varchar,
	"pid" varchar(255),
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;