<?php

namespace App\Knowledge\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeCategory extends Model
{
    protected $guarded = [];

    public function articles(): HasMany
    {
        return $this->hasMany(KnowledgeArticle::class);
    }
}
