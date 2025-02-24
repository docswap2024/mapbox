CREATE TABLE "offer" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"purchase_price" varchar NOT NULL,
	"deposit_amount" varchar NOT NULL,
	"message" varchar,
	"pid" varchar(255),
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offer_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password_hash" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "email_verified";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "user_status";