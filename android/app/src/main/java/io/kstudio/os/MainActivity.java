package io.kstudio.os;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Tell Android to lay out *within* the system windows (NOT edge-to-edge)
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
  }
}
