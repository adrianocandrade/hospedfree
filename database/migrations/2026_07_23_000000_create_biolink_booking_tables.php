<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('booking_settings')) {
            Schema::create('booking_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->unique();
            $table->string('timezone', 64)->default('UTC');
            $table->unsignedSmallInteger('default_slot_interval_minutes')->default(30);
            $table->unsignedSmallInteger('default_capacity')->default(1);
            $table->unsignedInteger('cancellation_deadline_minutes')->nullable();
            $table->boolean('customer_can_cancel')->default(true);
            $table->boolean('customer_can_reschedule')->default(true);
            $table->boolean('reminder_enabled')->default(false);
            $table->unsignedInteger('reminder_minutes')->default(1440);
            $table->timestamps();
            });
        }

        if (!Schema::hasTable('booking_services')) {
            Schema::create('booking_services', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->index('booking_services_biolink_idx');
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('service_type', 24)->default('appointment');
            $table->unsignedSmallInteger('duration_minutes')->default(30);
            $table->unsignedSmallInteger('slot_interval_minutes')->nullable();
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->unsignedSmallInteger('buffer_before_minutes')->default(0);
            $table->unsignedSmallInteger('buffer_after_minutes')->default(0);
            $table->decimal('price', 12, 2)->nullable();
            $table->string('currency', 3)->nullable();
            $table->string('meeting_url', 2048)->nullable();
            $table->string('payment_method', 16)->default('none');
            $table->string('payment_url', 2048)->nullable();
            $table->string('pix_key')->nullable();
            $table->text('payment_instructions')->nullable();
            $table->string('payment_confirmation_url', 2048)->nullable();
            $table->text('payment_confirmation_instructions')->nullable();
            $table->boolean('release_info_after_booking')->default(true);
            $table->boolean('active')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['biolink_id', 'active'], 'booking_services_active_idx');
            });
        }

        if (!Schema::hasTable('booking_availability_rules')) {
            Schema::create('booking_availability_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->index('booking_rules_biolink_idx');
            $table->unsignedTinyInteger('weekday');
            $table->string('start_time', 5);
            $table->string('end_time', 5);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['biolink_id', 'weekday', 'active'], 'booking_rules_weekday_idx');
            });
        }

        if (!Schema::hasTable('booking_availability_exceptions')) {
            Schema::create('booking_availability_exceptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->index('booking_exceptions_biolink_idx');
            $table->date('exception_date');
            $table->string('type', 16)->default('closed');
            $table->string('start_time', 5)->nullable();
            $table->string('end_time', 5)->nullable();
            $table->string('reason')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['biolink_id', 'exception_date', 'active'], 'booking_exceptions_date_idx');
            });
        }

        if (!Schema::hasTable('booking_appointments')) {
            Schema::create('booking_appointments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('biolink_id')->index('booking_appointments_biolink_idx');
            $table->unsignedBigInteger('workspace_id')->index();
            $table->unsignedBigInteger('service_id')->index();
            $table->timestamp('starts_at')->index();
            $table->timestamp('ends_at');
            $table->string('timezone', 64);
            $table->string('customer_name', 120);
            $table->string('customer_email', 255)->index();
            $table->string('customer_phone', 40)->nullable();
            $table->string('status', 32)->default('confirmed')->index();
            $table->string('manage_token_hash', 64)->unique();
            $table->timestamp('manage_token_expires_at')->nullable();
            $table->string('meeting_url', 2048)->nullable();
            $table->string('payment_url', 2048)->nullable();
            $table->string('pix_key')->nullable();
            $table->text('payment_instructions')->nullable();
            $table->string('payment_confirmation_url', 2048)->nullable();
            $table->text('payment_confirmation_instructions')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->string('currency', 3)->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['biolink_id', 'starts_at', 'status'], 'booking_appointments_time_idx');
            });
        }

        if (!Schema::hasTable('booking_appointment_events')) {
            Schema::create('booking_appointment_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('appointment_id')->index();
            $table->unsignedBigInteger('actor_id')->nullable()->index();
            $table->string('event', 40);
            $table->json('metadata')->nullable();
            $table->timestamps();
            });
        }

        if (!Schema::hasTable('booking_mail_connections')) {
            Schema::create('booking_mail_connections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id')->index();
            $table->string('name', 100);
            $table->string('provider', 24)->default('platform');
            $table->string('from_address', 255)->nullable();
            $table->string('from_name', 120)->nullable();
            $table->string('reply_to', 255)->nullable();
            $table->text('credentials')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamp('last_tested_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
            });
        }

        if (!Schema::hasTable('booking_email_usage')) {
            Schema::create('booking_email_usage', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id')->index();
            $table->string('period', 7);
            $table->unsignedInteger('platform_sent')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'period']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_email_usage');
        Schema::dropIfExists('booking_mail_connections');
        Schema::dropIfExists('booking_appointment_events');
        Schema::dropIfExists('booking_appointments');
        Schema::dropIfExists('booking_availability_exceptions');
        Schema::dropIfExists('booking_availability_rules');
        Schema::dropIfExists('booking_services');
        Schema::dropIfExists('booking_settings');
    }
};
