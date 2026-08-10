<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('booking_services')) {
            return;
        }

        Schema::table('booking_services', function (Blueprint $table) {
            if (!Schema::hasColumn('booking_services', 'service_type')) {
                $table->string('service_type', 24)->default('appointment')->after('image');
            }
            if (!Schema::hasColumn('booking_services', 'payment_method')) {
                $table->string('payment_method', 16)->default('none')->after('meeting_url');
            }
        });

        if (Schema::hasColumn('booking_services', 'capacity')) {
            Schema::table('booking_services', function (Blueprint $table) {
                $table->unsignedSmallInteger('capacity')->nullable()->default(null)->change();
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('booking_services')) {
            return;
        }

        if (Schema::hasColumn('booking_services', 'capacity')) {
            Schema::table('booking_services', function (Blueprint $table) {
                $table->unsignedSmallInteger('capacity')->default(1)->change();
            });
        }

        Schema::table('booking_services', function (Blueprint $table) {
            if (Schema::hasColumn('booking_services', 'payment_method')) {
                $table->dropColumn('payment_method');
            }
            if (Schema::hasColumn('booking_services', 'service_type')) {
                $table->dropColumn('service_type');
            }
        });
    }
};
