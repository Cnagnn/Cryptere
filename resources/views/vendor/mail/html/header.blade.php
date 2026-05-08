@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel' || trim($slot) === config('app.name'))
<img src="{{ asset('images/Logo/Logomark.svg') }}" class="logo" alt="{{ config('app.name') }}" width="156" height="48">
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
