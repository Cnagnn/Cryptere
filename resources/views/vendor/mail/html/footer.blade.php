<tr>
<td>
<table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td class="content-cell" align="center">
<p style="color: #64748b; font-size: 12px;">
© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.<br>
Learn to code through challenges and interactive courses.
</p>
{{ Illuminate\Mail\Markdown::parse($slot) }}
</td>
</tr>
</table>
</td>
</tr>
