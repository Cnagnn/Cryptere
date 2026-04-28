<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Topic extends Model
{
    protected $fillable = ['slug', 'name', 'category'];

    public function challenges()
    {
        return $this->belongsToMany(Challenge::class, 'challenge_topic');
    }

    public function quizQuestions()
    {
        return $this->hasMany(QuizQuestion::class);
    }

    public function relatedLessonSlug()
    {
        // Simple heuristic: find lesson with similar title or tag
        return Lesson::where('title', 'like', "%{$this->name}%")
            ->orWhere('description', 'like', "%{$this->name}%")
            ->value('slug');
    }
}
