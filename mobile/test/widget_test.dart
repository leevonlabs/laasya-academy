import 'package:flutter_test/flutter_test.dart';
import 'package:laasya_academy_mobile/main.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const LaasyaAcademyApp());
    expect(find.byType(LaasyaAcademyApp), findsOneWidget);
  });
}
