<?php

namespace Tests\Unit;

use App\Hosting\Rules\Hostname;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class HostingHostnameTest extends TestCase
{
    public function test_it_accepts_an_ftp_hostname_without_triggering_a_regex_error(): void
    {
        $validator = Validator::make(
            ['host' => 'ftpupload.net'],
            ['host' => ['required', new Hostname()]],
        );

        $this->assertFalse($validator->fails());
    }

    public function test_it_rejects_a_url_when_only_a_hostname_is_expected(): void
    {
        $validator = Validator::make(
            ['host' => 'https://cpanel.hsite.top'],
            ['host' => ['required', new Hostname()]],
        );

        $this->assertTrue($validator->fails());
    }
}
