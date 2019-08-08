<h1>
	This is a carousel!
</h1>
<section id="#carousel">
	<div class="track">
		<% loop Content.Slides %>
			<div class="slide">
				<div class="image" style="background-image: url({$Image.URL})">
				</div>
				<h3>
					$Title
				</h3>
			</div>
		<% end_loop Content.Slides %>
	</div>
	<button class="prev arrow">
		👈
	</button>
	<button class="next arrow">
		👉
	</button>
</section>
