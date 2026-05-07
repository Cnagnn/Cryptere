@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel' || trim($slot) === config('app.name'))
<span style="font-size: 24px; font-weight: 700; color: #a78bfa; letter-spacing: -0.5px;">🔐 {{ config('app.name') }}</span>
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
